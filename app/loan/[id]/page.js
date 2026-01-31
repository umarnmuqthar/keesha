import { db } from '@/lib/firebase-admin';
import LoanDetails from '@/app/components/LoanDetails';

async function getLoan(id) {
    const docRef = db.collection('loans').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) return null;

    // Fetch payments map
    const paymentsSnapshot = await docRef.collection('payments').get();
    const payments = {};
    paymentsSnapshot.forEach(pDoc => {
        payments[pDoc.id] = pDoc.data(); // Key is YYYY-MM or matching schedule ID
    });

    return {
        id: docSnap.id,
        ...docSnap.data(),
        payments
    };
}

export default async function Page({ params }) {
    const loan = await getLoan(params.id);

    if (!loan) {
        return <div style={{ color: '#111827', padding: '2rem' }}>Loan not found</div>;
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <LoanDetails loan={loan} />
            </div>
        </main>
    );
}
