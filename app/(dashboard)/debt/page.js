import { db } from '@/lib/firebase-admin';
import DebtDashboard from '@/app/components/DebtDashboard';

import { getSession } from '@/app/actions/authActions';
import { cache } from 'react';

const getDebtData = cache(async function getDebtData(userId) {
    if (!userId) return [];

    try {
        const snapshot = await db.collection('debt_accounts')
            .where('userId', '==', userId)
            // .orderBy('lastInteraction', 'desc') // Removed to avoid composite index requirement
            .get();
        const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        await Promise.all(accounts.map(async (account) => {
            const transSnapshot = await db.collection('debt_accounts').doc(account.id).collection('transactions').get();
            let netBalance = 0;
            const transactions = transSnapshot.docs.map(tDoc => {
                const tData = tDoc.data();
                const amount = parseFloat(tData.amount || 0);
                if (tData.type === 'GIVE') netBalance += amount;
                else if (tData.type === 'GOT') netBalance -= amount;
                return { id: tDoc.id, ...tData };
            });
            account.transactions = transactions;
            account.netBalance = netBalance;
        }));

        // Sort in memory
        accounts.sort((a, b) => new Date(b.lastInteraction) - new Date(a.lastInteraction));

        return accounts;
    } catch (e) {
        console.error("Error fetching debt data:", e);
        return [];
    }
});

export default async function DebtPage() {
    const session = await getSession();
    const accounts = await getDebtData(session?.uid);

    return (
        <main className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <DebtDashboard initialAccounts={accounts} />
            </div>
        </main>
    );
}
