import { getFirestore } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase-admin';
import SubscriptionDashboard from '../components/KeeshaDashboard';
import { updateProfile } from '../actions';

import { getSession } from '../actions/authActions';

async function getSubscriptions(userId) {
    if (!userId) return [];

    // Filter by userId
    const snapshot = await db.collection('subscriptions').where('userId', '==', userId).get();
    const subscriptions = [];
    snapshot.forEach(doc => {
        subscriptions.push({ id: doc.id, ...doc.data() });
    });

    // Also fetch ledger for each sub
    for (let sub of subscriptions) {
        const ledgerSnapshot = await db.collection('subscriptions').doc(sub.id).collection('ledger').orderBy('date', 'desc').get();
        sub.ledger = ledgerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    return subscriptions;
}

async function getUserProfile() {
    const session = await getSession();
    if (!session) return null;
    const doc = await db.collection('users').doc(session.uid).get(); // Use session uid
    if (doc.exists) return { id: doc.id, ...doc.data() };
    return null;
}

export default async function SubscriptionsPage() {
    const session = await getSession();
    const subscriptions = await getSubscriptions(session?.uid);
    const profile = await getUserProfile();

    return (
        <main className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <SubscriptionDashboard subscriptions={subscriptions} userProfile={profile} updateProfile={updateProfile} />
            </div>
        </main>
    );
}
