
import { db } from '@/lib/firebase-admin';
import SubscriptionDetails from '@/app/components/SubscriptionDetails';

async function getSubscription(id) {
    const docRef = db.collection('subscriptions').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) return null;

    const ledgerSnapshot = await docRef.collection('ledger').get();
    const ledger = ledgerSnapshot.docs.map(l => ({
        id: l.id,
        ...l.data()
    }));

    return {
        id: docSnap.id,
        ...docSnap.data(),
        ledger,
    };
}

export default async function Page({ params }) {
    const subscription = await getSubscription(params.id);

    if (!subscription) {
        return <div style={{ color: 'white', padding: '2rem' }}>Subscription not found</div>;
    }

    return (
        <main className="min-h-screen">
            <div className="max-w-7xl mx-auto">
                <SubscriptionDetails subscription={subscription} />
            </div>
        </main>
    );
}
