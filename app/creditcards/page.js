import React from 'react';
import PageHeader from '../components/PageHeader';
import CreditCardDashboard from '../components/CreditCardDashboard';
import { db } from '@/lib/firebase-admin';
import { getSession } from '../actions/authActions';

export default async function CreditCardsPage() {
    const session = await getSession();
    if (!session) return null;

    // Fetch cards without orderBy initially to avoid index requirements
    const cardsSnapshot = await db.collection('creditcards')
        .where('userId', '==', session.uid)
        .get();

    const cards = cardsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    return (
        <main className="min-h-screen">
            <div className="max-w-7xl mx-auto">
                <CreditCardDashboard cards={cards} />
            </div>
        </main>
    );
}
