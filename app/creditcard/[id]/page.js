import React from 'react';
import { db } from '@/lib/firebase-admin';
import CreditCardDetailView from '@/app/components/CreditCardDetailView';

export default async function CreditCardPage({ params }) {
    const { id } = params;

    const cardDoc = await db.collection('creditcards').doc(id).get();
    if (!cardDoc.exists) return <div>Card not found</div>;

    const card = { id: cardDoc.id, ...cardDoc.data() };

    const txSnapshot = await db.collection('creditcards')
        .doc(id)
        .collection('transactions')
        .orderBy('date', 'desc')
        .get();

    const transactions = txSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    return (
        <main className="min-h-screen">
            <div className="max-w-7xl mx-auto">
                <CreditCardDetailView card={card} transactions={transactions} />
            </div>
        </main>
    );
}
