import React from 'react';
import CreditCardDashboard from '../components/CreditCardDashboard';
import { db } from '@/lib/firebase-admin';
import PageHeaderActions from '../components/PageHeaderActions';
import { getSession } from '../actions/authActions';
import { redirect } from 'next/navigation';

async function getCreditCards(userId) {
    const cardsSnapshot = await db.collection('creditcards')
        .where('userId', '==', userId)
        .get();

    return cardsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

export default async function CreditCardsPage() {
    const user = await getSession();
    if (!user) redirect('/login');

    const cards = await getCreditCards(user.uid);

    return (
        <main className="min-h-screen">
            <div className="max-w-7xl mx-auto">
                <PageHeaderActions
                    title="Credit Cards"
                    subtitle="Track your card balances and statement cycles."
                    backPath="/"
                />
                <CreditCardDashboard cards={cards} />
            </div>
        </main>
    );
}
