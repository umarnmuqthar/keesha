'use client';

import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { AddButton, Card } from '@/components/ui';
import { useModalState } from '@/components/ui/useModalState';
import AddLoanModal from '@/features/legacy/components/AddLoanModal';
import shellStyles from '../app-shell.module.css';
import styles from './loans.module.css';

type Loan = {
  id: string;
  name?: string;
  lender?: string;
  type?: string;
  emiDay?: number;
  emiAmount?: number;
  monthlyEmi?: number;
  amount?: number;
  outstandingAmount?: number;
  remainingAmount?: number;
};

type LoansPageClientProps = {
  loans: Loan[];
};

const formatAmount = (value?: number) => {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString('en-IN')}`;
};

export default function LoansPageClient({ loans }: LoansPageClientProps) {
  const modal = useModalState(false);

  const totalOutstanding = loans.reduce(
    (sum, loan) => sum + Number(loan?.outstandingAmount || loan?.remainingAmount || 0),
    0
  );

  const existingNames = loans.map((loan) => loan.name || '').filter(Boolean);

  return (
    <>
      <AppShell
        sidebar={<Sidebar />}
        header={
          <div className={shellStyles.header}>
            <div>
              <p className={shellStyles.eyebrow}>Loans</p>
              <h1>Debt commitments</h1>
            </div>
            <div className={shellStyles.headerActions}>
              <AddButton size="sm" onClick={modal.open}>Add loan</AddButton>
            </div>
          </div>
        }
      >
        <div className={styles.page}>
          <section className={styles.hero}>
            <div>
              <h2>Stay on top of repayments</h2>
              <p>Track EMIs, balances, and upcoming due dates in one place.</p>
            </div>
            <div className={styles.heroStats}>
              <Card className={styles.statCard}>
                <p className={styles.label}>Active loans</p>
                <h3>{loans.length}</h3>
              </Card>
              <Card className={styles.statCard}>
                <p className={styles.label}>Outstanding</p>
                <h3>{formatAmount(totalOutstanding)}</h3>
              </Card>
            </div>
          </section>

          <section className={styles.list}>
            {loans.length === 0 ? (
              <Card className={styles.empty}>
                <h3>No loans yet</h3>
                <p>Add a loan to start tracking monthly repayments.</p>
                <AddButton size="sm" onClick={modal.open}>Add loan</AddButton>
              </Card>
            ) : (
              loans.map((loan) => (
                <Link key={loan.id} href={`/loans/${loan.id}`} className={styles.itemLink}>
                  <Card className={styles.item}>
                    <div>
                      <h3>{loan.name || 'Loan'}</h3>
                      <p>{loan.lender || loan.type || 'Loan account'}</p>
                    </div>
                    <div className={styles.itemMeta}>
                      <span>{loan.emiDay ? `Due on ${loan.emiDay}` : 'Monthly'}</span>
                      <strong>{formatAmount(loan.emiAmount || loan.monthlyEmi || loan.amount)}</strong>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </section>
        </div>
      </AppShell>

      <AddLoanModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        existingNames={existingNames as any}
      />
    </>
  );
}
