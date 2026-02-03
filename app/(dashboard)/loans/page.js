import { db } from '@/lib/firebase-admin';
import LoanDashboard from '@/app/components/LoanDashboard';
import { getSession } from '@/app/actions/authActions';
import { cache } from 'react';

const getLoans = cache(async function getLoans(userId) {
    if (!userId) return [];

    const snapshot = await db.collection('loans').where('userId', '==', userId).get();
    const loans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    await Promise.all(loans.map(async (loan) => {
        const paymentsSnapshot = await db.collection('loans').doc(loan.id).collection('payments').get();
        const payments = {};
        paymentsSnapshot.forEach(pDoc => {
            payments[pDoc.id] = pDoc.data(); // Key is YYYY-MM
        });
        loan.payments = payments;
    }));

    return loans;
});

export default async function LoansPage() {
    const session = await getSession();
    const loans = await getLoans(session?.uid);

    return (
        <main className="min-h-screen">
            <div className="max-w-7xl mx-auto">
                <LoanDashboard initialLoans={loans} />
            </div>
        </main>
    );
}
