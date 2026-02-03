import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import DebtDetailView from '@/app/components/DebtDetailView';
import { notFound } from 'next/navigation';
import { cache } from 'react';

const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
);

if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}

const db = getFirestore();

const getAccountData = cache(async function getAccountData(id) {
    const doc = await db.collection('debt_accounts').doc(id).get();
    if (!doc.exists) return null;

    const accountData = { id: doc.id, ...doc.data() };
    const transSnapshot = await db.collection('debt_accounts').doc(id).collection('transactions').orderBy('date', 'desc').get();

    let totalGiven = 0;
    let totalTaken = 0;
    let settledAmount = 0;
    let netBalance = 0;

    const transactions = transSnapshot.docs.map(tDoc => {
        const tData = tDoc.data();
        const amount = parseFloat(tData.amount || 0);

        if (tData.type === 'GIVE') {
            netBalance += amount;
            if (tData.status === 'Settled' || tData.description === 'Account Settlement') {
                settledAmount += amount;
            } else {
                totalGiven += amount;
            }
        } else if (tData.type === 'GOT') {
            netBalance -= amount;
            if (tData.status === 'Settled' || tData.description === 'Account Settlement') {
                settledAmount += amount;
            } else {
                totalTaken += amount;
            }
        }

        return { id: tDoc.id, ...tData };
    });

    return {
        ...accountData,
        transactions,
        stats: { totalGiven, totalTaken, settledAmount },
        netBalance
    };
});

export default async function DebtDetailPage({ params }) {
    const { id } = params;
    const account = await getAccountData(id);

    if (!account) notFound();

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto space-y-8">
                <DebtDetailView account={account} />
            </div>
        </main>
    );
}
