'use server';


import { getSession } from './authActions';
import { getFirestore } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

/**
 * Add a new debt account (person/entity)
 */
export async function addDebtAccount(formData) {
    const session = await getSession();
    if (!session) return { error: 'Unauthorized' };

    const name = formData.get('name');
    const type = formData.get('type') || 'Friend'; // Friend, Family, Business, etc.

    if (!name) return { error: 'Name is required' };

    const newAccount = {
        userId: session.uid,
        name,
        type,
        status: 'Active',
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
    const amount = parseFloat(formData.get('amount'));
    const description = formData.get('description');
    const type = formData.get('type'); // GIVE or GOT
    const date = formData.get('date') || new Date().toISOString();
    const reminderDate = formData.get('reminderDate') || null;

    if (!amount || !type) return { error: 'Amount and type are required' };

    const batch = db.batch();

    // 1. Add the transaction
    const transRef = db.collection('debt_accounts').doc(accountId).collection('transactions').doc();
    batch.set(transRef, {
        amount,
        description,
        type,
        date,
        status: 'Pending',
        createdAt: new Date().toISOString()
    });

    // 2. Update account last interaction
    const accountRef = db.collection('debt_accounts').doc(accountId);
    batch.update(accountRef, {
        lastInteraction: new Date().toISOString(),
        ...(reminderDate ? { reminderDate } : {})
    });

    await batch.commit();

    revalidatePath(`/debt/${accountId}`);
    revalidatePath('/debt');
    return { success: true };
}

/**
 * Settle the entire account balance
 */
export async function settleDebtAccount(accountId, currentBalance) {
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
    const name = formData.get('name');
    const type = formData.get('type');

    if (!name) return { error: 'Name is required' };

    await db.collection('debt_accounts').doc(accountId).update({
        name,
        type,
        lastInteraction: new Date().toISOString()
    });

    revalidatePath(`/debt/${accountId}`);
    revalidatePath('/debt');
    return { success: true };
}

/**
 * Delete a debt account and all its transactions
 */
export async function deleteDebtAccount(accountId) {
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
