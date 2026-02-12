import { db } from '@/lib/firebase-admin';
import { getSession } from '@/app/actions/authActions';
import { cache } from 'react';
import CreditCardsPageClient from './CreditCardsPageClient';

const getCards = cache(async function getCards(userId?: string) {
  if (!userId) return [] as Array<any>;
  const snapshot = await db.collection('creditcards').where('userId', '==', userId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
});

export default async function CreditCardsPage() {
  const session = await getSession();
  const cards = await getCards(session?.uid);

  return <CreditCardsPageClient cards={cards as any[]} />;
}
