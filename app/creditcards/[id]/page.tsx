import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import shellStyles from '@/app/app-shell.module.css';
import { db } from '@/lib/firebase-admin';
import { getSession } from '@/app/actions/authActions';
import CreditCardDetailView from '@/features/legacy/components/CreditCardDetailView';

export default async function CreditCardDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.uid) return notFound();

  const cardDoc = await db.collection('creditcards').doc(params.id).get();
  if (!cardDoc.exists) return notFound();

  const card = { id: cardDoc.id, ...cardDoc.data() } as any;
  if (card.userId && card.userId !== session.uid) return notFound();

  const txSnapshot = await db
    .collection('creditcards')
    .doc(params.id)
    .collection('transactions')
    .orderBy('date', 'desc')
    .get();

  const transactions = txSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return (
    <AppShell
      sidebar={<Sidebar />}
      header={
        <div className={shellStyles.header}>
          <div>
            <p className={shellStyles.eyebrow}>Credit Card Details</p>
            <h1>{card.name || 'Credit Card'}</h1>
          </div>
        </div>
      }
    >
      <CreditCardDetailView card={card as any} transactions={transactions as any} />
    </AppShell>
  );
}
