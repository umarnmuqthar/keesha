import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import shellStyles from '@/app/app-shell.module.css';
import { db } from '@/lib/firebase-admin';
import { getSession } from '@/app/actions/authActions';
import DebtDetailClient from './DebtDetailClient';

type DebtTransaction = {
  id: string;
  amount?: number | string;
  type?: 'GIVE' | 'GOT' | string;
  date?: string;
  description?: string;
  status?: string;
};

export default async function DebtDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.uid) return notFound();

  const accountDoc = await db.collection('debt_accounts').doc(params.id).get();
  if (!accountDoc.exists) return notFound();

  const account = { id: accountDoc.id, ...accountDoc.data() } as any;
  if (account.userId && account.userId !== session.uid) return notFound();

  const txSnapshot = await db
    .collection('debt_accounts')
    .doc(params.id)
    .collection('transactions')
    .orderBy('date', 'desc')
    .get();

  const transactions = txSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as DebtTransaction[];

  let totalGiven = 0;
  let totalTaken = 0;
  let netBalance = 0;

  transactions.forEach((tx) => {
    const amount = Number(tx.amount || 0);
    if (tx.type === 'GIVE') {
      totalGiven += amount;
      netBalance += amount;
      return;
    }
    if (tx.type === 'GOT') {
      totalTaken += amount;
      netBalance -= amount;
    }
  });

  return (
    <AppShell
      sidebar={<Sidebar />}
      header={
        <div className={shellStyles.header}>
          <div>
            <p className={shellStyles.eyebrow}>Debt Details</p>
            <h1>{account.name || 'Debt account'}</h1>
          </div>
        </div>
      }
    >
      <DebtDetailClient
        account={account as any}
        transactions={transactions as any[]}
        totals={{ totalGiven, totalTaken, netBalance }}
      />
    </AppShell>
  );
}
