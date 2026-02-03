import { db } from '@/lib/firebase-admin';
import SubscriptionDashboard from '@/app/components/KeeshaDashboard';
import { updateProfile } from '@/app/actions';

import { getSession } from '@/app/actions/authActions';
import { cache } from 'react';

const getSubscriptions = cache(async function getSubscriptions(userId) {
    if (!userId) return [];

    // Filter by userId
    const snapshot = await db.collection('subscriptions').where('userId', '==', userId).get();
    const subscriptions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Also fetch ledger for each sub
    await Promise.all(subscriptions.map(async (sub) => {
        const ledgerSnapshot = await db.collection('subscriptions').doc(sub.id).collection('ledger').orderBy('date', 'desc').get();
        sub.ledger = ledgerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }));

    return subscriptions;
});

const getUserProfile = cache(async function getUserProfile(userId) {
    if (!userId) return null;
    const doc = await db.collection('users').doc(userId).get(); // Use session uid
    if (doc.exists) return { id: doc.id, ...doc.data() };
    return null;
});

export default async function SubscriptionsPage() {
    const session = await getSession();
    const [subscriptions, profile] = await Promise.all([
        getSubscriptions(session?.uid),
        getUserProfile(session?.uid)
    ]);

    return (
        <main className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <SubscriptionDashboard subscriptions={subscriptions} userProfile={profile} updateProfile={updateProfile} />
            </div>
        </main>
    );
}
