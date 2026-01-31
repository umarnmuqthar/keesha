import { db } from '@/lib/firebase-admin';
import LoanDashboard from '@/app/components/LoanDashboard';
import { getSession } from '@/app/actions/authActions';

async function getLoans(userId) {
    if (!userId) return [];

    const snapshot = await db.collection('loans').where('userId', '==', userId).get();
    const loans = [];

    for (const doc of snapshot.docs) {
        const loanData = { id: doc.id, ...doc.data() };

        // Fetch payments map
        const paymentsSnapshot = await db.collection('loans').doc(doc.id).collection('payments').get();
        const payments = {};
        paymentsSnapshot.forEach(pDoc => {
            payments[pDoc.id] = pDoc.data(); // Key is YYYY-MM
        });
        loanData.payments = payments;

        loans.push(loanData);
    }

    return loans;
}

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
