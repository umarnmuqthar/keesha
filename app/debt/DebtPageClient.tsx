'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader, TabButton, ActionButton } from '@/components/layout/PageHeader';
import { useShellSearch } from '@/components/layout/ShellSearchContext';
import { AddButton, Card } from '@/components/ui';
import { useModalState } from '@/components/ui/useModalState';
import AddDebtModal from '@/features/legacy/components/AddDebtModal';
import DebtDetailsModal from './DebtDetailsModal';
import { LayoutDashboard } from 'lucide-react';
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
  const [selectedAccount, setSelectedAccount] = useState<DebtAccount | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'dashboard'>('list');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Settled'>('All');
  const { query: searchQuery } = useShellSearch();
  const query = searchQuery.trim().toLowerCase();

  const filteredByStatus = useMemo(() => {
    if (statusFilter === 'All') return accounts;
    return accounts.filter(acc => (acc.status || 'Active') === statusFilter);
  }, [accounts, statusFilter]);

  const filteredAccounts = useMemo(() => {
    if (!query) return filteredByStatus;
    return filteredByStatus.filter((account) =>
      (account.name || '').toLowerCase().includes(query) ||
      (account.type || '').toLowerCase().includes(query)
    );
  }, [filteredByStatus, query]);

  const totalOpenBalance = accounts.reduce(
    (sum, account) => sum + Math.abs(Number(account.netBalance || 0)),
    0
  );

  return (
    <>
      <AppShell
        sidebar={<Sidebar />}
        header={
          <PageHeader
            title=""
            showSearch={true}
            tabs={
              <>
                {(['All', 'Active', 'Settled'] as const).map(status => (
                  <TabButton
                    key={status}
                    active={statusFilter === status}
                    onClick={() => {
                      setStatusFilter(status);
                      setViewMode('list');
                    }}
                  >
                    {status}
                  </TabButton>
                ))}
              </>
            }
            filters={
              <ActionButton
                active={viewMode === 'dashboard'}
                onClick={() => setViewMode(prev => prev === 'dashboard' ? 'list' : 'dashboard')}
                title="Toggle Dashboard"
              >
                <LayoutDashboard size={16} />
              </ActionButton>
            }
            actions={<AddButton size="sm" onClick={modal.open}>Add debt</AddButton>}
          />
        }
      >
        <div className={styles.page}>
          {viewMode === 'dashboard' && (
            <section className={styles.hero}>
              <div className={styles.heroStats}>
                <Card className={styles.statCard}>
                  <p className={styles.label}>Active accounts</p>
                  <h3>{accounts.filter(a => (a.status || 'Active') === 'Active').length}</h3>
                </Card>
                <Card className={styles.statCard}>
                  <p className={styles.label}>Total open balance</p>
                  <h3>{formatAmount(totalOpenBalance)}</h3>
                </Card>
              </div>
            </section>
          )}

          {viewMode === 'list' && (
            <section className={styles.list}>
              {filteredAccounts.length === 0 ? (
                <Card className={styles.placeholder}>
                  <h3>{query ? 'No matching accounts' : 'No debts yet'}</h3>
                  <p>
                    {query
                      ? `No account found for "${searchQuery}".`
                      : 'Add personal debts or IOUs to track repayments.'}
                  </p>
                  {!query ? <AddButton size="sm" onClick={modal.open}>Add debt</AddButton> : null}
                </Card>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.nameCell}>Person / Entity</th>
                        <th className={styles.typeCell}>Type</th>
                        <th className={styles.statusCell}>Status</th>
                        <th className={styles.amountCell}>Net Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccounts.map((account) => (
                        <tr 
                          key={account.id} 
                          className={styles.tableRow}
                          onClick={() => setSelectedAccount(account)}
                        >
                          <td className={styles.nameCell}>
                            <div className={styles.accountInfo}>
                              <strong>{account.name || "Debt Account"}</strong>
                            </div>
                          </td>
                          <td>{account.type || "Personal"}</td>
                          <td className={styles.statusCell}>
                            <span className={`
                              ${styles.statusBadge} 
                              ${(account.status || 'Active') === 'Active' ? styles.statusActive : styles.statusSettled}
                            `}>
                              {account.status || 'Active'}
                            </span>
                          </td>
                          <td className={`${styles.amountCol} ${account.status === 'Settled' ? styles.settledText : (account.netBalance || 0) > 0 ? styles.posText : styles.negText}`}>
                            {formatAmount(account.netBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </AppShell>

      <DebtDetailsModal
        account={selectedAccount}
        onClose={() => setSelectedAccount(null)}
      />

      <AddDebtModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        accounts={accounts}
        onAccountAdded={() => undefined}
      />
    </>
  );
}

