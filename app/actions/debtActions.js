'use server';

import { getSession } from './authActions';
// import { getFirestore } from 'firebase-admin/firestore';
// import { db } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

/**
 * Add a new debt account (person/entity)
 */
export async function addDebtAccount(formData) {
    const session = await getSession();
    if (!session) return { error: 'Unauthorized' };
    const { db } = await import('@/lib/firebase-admin');

    const name = formData.get('name')?.trim();
    const type = formData.get('type') || 'Friend'; // Friend, Family, Business, etc.

    if (!name) return { error: 'Name is required' };
    const nameLowercase = name.toLowerCase();

    // Server-side uniqueness check
    const existingSnapshot = await db.collection('debt_accounts')
        .where('userId', '==', session.uid)
        .where('nameLowercase', '==', nameLowercase)
        .limit(1)
        .get();

    if (!existingSnapshot.empty) {
        return { error: 'An account with this name already exists' };
    }

    const newAccount = {
        userId: session.uid,
        name,
        nameLowercase,
        type,
        status: 'Active',
        netBalance: 0,
        createdAt: new Date().toISOString(),
        lastInteraction: new Date().toISOString()
    };

    const docRef = await db.collection('debt_accounts').add(newAccount);

    revalidatePath('/debt');
    return {
        success: true,
        account: { id: docRef.id, ...newAccount, transactions: [], netBalance: 0 }
    };
}

/**
 * Add a transaction entry (GIVE or GOT)
 */
export async function addDebtEntry(accountId, formData) {
    const { db } = await import('@/lib/firebase-admin');
    // Normalize inputs if coming from Map instead of FormData
    const getVal = (name) => {
        if (formData && typeof formData.get === 'function') return formData.get(name);
        return formData[name];
    };

    const amount = parseFloat(getVal('amount'));
    const description = getVal('description');
    const type = getVal('type'); // GIVE or GOT
    const date = getVal('date') || new Date().toISOString();
    const reminderDate = getVal('reminderDate') || null;

    if (!amount || !type) return { error: 'Amount and type are required' };

    const accountRef = db.collection('debt_accounts').doc(accountId);

    try {
        await db.runTransaction(async (transaction) => {
            const accountDoc = await transaction.get(accountRef);
            if (!accountDoc.exists) throw new Error('Account not found');

            const accountData = accountDoc.data();
            const currentBalance = accountData.netBalance || 0;
            
            // GIVE is negative (money going out), GOT is positive (money coming in)
            // Wait, looking at DebtDetailsModal: 
            // {t.type === 'GIVE' ? '- ' : '+ '}{formatAmount(t.amount)}
            // and 125: const isOweMe = (account.netBalance || 0) > 0;
            // So GOT (Received) increases the balance (they owe you less/you owe them more?)
            // Actually, usually:
            // GIVE: You give money (They owe you more) -> + Balance
            // GOT: You get money (They owe you less) -> - Balance
            // Let's check DebtDetailsModal logic again.
            // 151: h1 className={isOweMe ? styles.posBalance : styles.negBalance}
            // 8: ArrowUpRight (GIVE), 9: ArrowDownLeft (GOT)
            // If I GIVE, it's an outflow. If I GOT, it's an inflow.
            // In typical debt tracking:
            // GIVE means I'm lending or paying back.
            // If Balance > 0 means "They owe me".
            // If I GIVE money to someone who owes me, Balance increases.
            // If I GOT money from someone who owes me, Balance decreases.
            
            let netChange = type === 'GIVE' ? amount : -amount;
            const newBalance = currentBalance + netChange;
            
            // Auto-settle logic
            let newStatus = accountData.status || 'Active';
            if (Math.abs(newBalance) < 0.01) {
                newStatus = 'Settled';
            } else if (newStatus === 'Settled') {
                newStatus = 'Active';
            }

            const transRef = accountRef.collection('transactions').doc();
            transaction.set(transRef, {
                amount,
                description,
                type,
                date,
                status: 'Pending',
                createdAt: new Date().toISOString()
            });

            transaction.update(accountRef, {
                netBalance: newBalance,
                status: newStatus,
                lastInteraction: new Date().toISOString(),
                ...(reminderDate ? { reminderDate } : {})
            });
        });

        revalidatePath(`/debt/${accountId}`);
        revalidatePath('/debt');
        return { success: true };
    } catch (e) {
        console.error('Add Debt Entry Error:', e);
        return { error: 'Failed to add entry' };
    }
}

/**
 * Settle the entire account balance
 */
export async function settleDebtAccount(accountId, currentBalance) {
    const { db } = await import('@/lib/firebase-admin');
    if (Math.abs(currentBalance) < 0.01) return { error: 'Balance is already zero' };

    const type = currentBalance > 0 ? 'GOT' : 'GIVE'; // If they owe you (pos), you get money to settle.
    const amount = Math.abs(currentBalance);

    await addDebtEntry(accountId, new Map([
        ['amount', amount],
        ['description', 'Account Settlement'],
        ['type', type],
        ['date', new Date().toISOString()]
    ]));

    // Mark as settled if needed, though usually just zero balance is enough.
    await db.collection('debt_accounts').doc(accountId).update({
        status: 'Settled'
    });

    revalidatePath(`/debt/${accountId}`);
    revalidatePath('/debt');
    return { success: true };
}

/**
 * Update reminder date for an account
 */
export async function updateDebtReminder(accountId, reminderDate) {
    const { db } = await import('@/lib/firebase-admin');
    await db.collection('debt_accounts').doc(accountId).update({
        reminderDate
    });
    revalidatePath(`/debt/${accountId}`);
    return { success: true };
}

/**
 * Update a debt account's basic info
 */
export async function updateDebtAccount(accountId, formData) {
    const { db } = await import('@/lib/firebase-admin');
    const name = formData.get('name');
    const type = formData.get('type');
    const status = formData.get('status');

    const updateData = {
        lastInteraction: new Date().toISOString()
    };
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (status) updateData.status = status;

    await db.collection('debt_accounts').doc(accountId).update(updateData);

    revalidatePath(`/debt/${accountId}`);
    revalidatePath('/debt');
    return { success: true };
}

/**
 * Get all transactions for a debt account
 */
export async function getDebtTransactions(accountId) {
    const { db } = await import('@/lib/firebase-admin');
    const snapshot = await db.collection('debt_accounts')
        .doc(accountId)
        .collection('transactions')
        .orderBy('date', 'desc')
        .get();
    
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

/**
 * Delete a debt account and all its transactions
 */
export async function deleteDebtAccount(accountId) {
    const { db } = await import('@/lib/firebase-admin');
    const accountRef = db.collection('debt_accounts').doc(accountId);

    // Delete transactions first
    const transSnapshot = await accountRef.collection('transactions').get();
    const batch = db.batch();
    transSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete the account itself
    batch.delete(accountRef);

    await batch.commit();

    revalidatePath('/debt');
    return { success: true };
}

/**
 * Recalculate and sync the netBalance for a debt account from its transactions
 */
export async function recalculateDebtBalance(accountId) {
    const { db } = await import('@/lib/firebase-admin');
    const accountRef = db.collection('debt_accounts').doc(accountId);
    
    try {
        const transactionsSnapshot = await accountRef.collection('transactions').get();
        let calculatedBalance = 0;
        
        transactionsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const amount = parseFloat(data.amount || 0);
            // GIVE increases balance (+), GOT decreases balance (-)
            if (data.type === 'GIVE') {
                calculatedBalance += amount;
            } else {
                calculatedBalance -= amount;
            }
        });
        
        await accountRef.update({
            netBalance: calculatedBalance,
            lastInteraction: new Date().toISOString()
        });
        
        revalidatePath(`/debt/${accountId}`);
        revalidatePath('/debt');
        return { success: true, newBalance: calculatedBalance };
    } catch (e) {
        console.error('Recalculate Debt Balance Error:', e);
        return { error: 'Failed to recalculate balance' };
    }
}

/**
 * Check if a debt account with the given name already exists for the user
 */
export async function checkDebtAccountExists(name) {
    if (!name || name.trim() === '') return false;
    
    const session = await getSession();
    if (!session) return false;
    
    const { db } = await import('@/lib/firebase-admin');
    
    const snapshot = await db.collection('debt_accounts')
        .where('userId', '==', session.uid)
        .where('nameLowercase', '==', name.trim().toLowerCase())
        .limit(1)
        .get();
        
    if (!snapshot.empty) return true;

    // Fallback for legacy records without nameLowercase
    const legacySnapshot = await db.collection('debt_accounts')
        .where('userId', '==', session.uid)
        .where('name', '==', name.trim())
        .limit(1)
        .get();

    return !legacySnapshot.empty;
}

