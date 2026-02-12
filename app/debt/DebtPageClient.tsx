'use client';

import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { AddButton, Card } from '@/components/ui';
import { useModalState } from '@/components/ui/useModalState';
import AddDebtModal from '@/features/legacy/components/AddDebtModal';
import shellStyles from '../app-shell.module.css';
import styles from './debt.module.css';

type DebtAccount = {
  id: string;
  name?: string;
  type?: string;
  status?: string;
  netBalance?: number;
};

type DebtPageClientProps = {
  accounts: DebtAccount[];
};

const formatAmount = (value?: number) => {
  const amount = Math.abs(Number(value || 0));
  return `₹${amount.toLocaleString('en-IN')}`;
};

export default function DebtPageClient({ accounts }: DebtPageClientProps) {
  const modal = useModalState(false);

  const activeAccounts = accounts.filter((account) => (account.status || 'Active') === 'Active').length;
  const totalOpenBalance = accounts.reduce(
    (sum, account) => sum + Math.abs(Number(account.netBalance || 0)),
    0
  );

  return (
    <>
      <AppShell
        sidebar={<Sidebar />}
        header={
          <div className={shellStyles.header}>
            <div>
              <p className={shellStyles.eyebrow}>Debt</p>
              <h1>Balances & IOUs</h1>
            </div>
            <div className={shellStyles.headerActions}>
              <AddButton size="sm" onClick={modal.open}>Add debt</AddButton>
            </div>
          </div>
        }
      >
        <div className={styles.page}>
          <section className={styles.hero}>
            <div>
              <h2>Track every personal balance</h2>
              <p>Manage what you owe and what others owe you in one place.</p>
            </div>
            <div className={styles.heroStats}>
              <Card className={styles.statCard}>
                <p className={styles.label}>Active accounts</p>
                <h3>{activeAccounts}</h3>
              </Card>
              <Card className={styles.statCard}>
                <p className={styles.label}>Open balance</p>
                <h3>{formatAmount(totalOpenBalance)}</h3>
              </Card>
            </div>
          </section>

          <section className={styles.list}>
            {accounts.length === 0 ? (
              <Card className={styles.placeholder}>
                <h3>No debts added</h3>
                <p>Add personal debts or IOUs to track repayments.</p>
                <AddButton size="sm" onClick={modal.open}>Add debt</AddButton>
              </Card>
            ) : (
              accounts.map((account) => (
                <Link key={account.id} href={`/debt/${account.id}`} className={styles.itemLink}>
                  <Card className={styles.item}>
                    <div>
                      <h3>{account.name || 'Debt account'}</h3>
                      <p>{account.type || 'Account'}</p>
                    </div>
                    <div className={styles.itemMeta}>
                      <span>{account.status || 'Active'}</span>
                      <strong>{formatAmount(account.netBalance || 0)}</strong>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </section>
        </div>
      </AppShell>

      <AddDebtModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        onAccountAdded={() => undefined}
      />
    </>
  );
}
