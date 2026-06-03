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

const getInitials = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

const getAvatarStyle = (name?: string) => {
  if (!name) return { background: 'linear-gradient(135deg, #e6f4f1 0%, #f6f4f0 100%)', color: '#0f766e' };
  
  const gradients = [
    { bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', color: '#dc2626' }, // Rose/Red
    { bg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', color: '#0284c7' }, // Blue
    { bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', color: '#15803d' }, // Green (darkened for better contrast)
    { bg: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)', color: '#a16207' }, // Yellow/Gold (darkened for better contrast)
    { bg: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', color: '#7e22ce' }, // Purple (darkened for better contrast)
    { bg: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)', color: '#c2410c' }, // Orange (darkened for better contrast)
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return { background: gradients[index].bg, color: gradients[index].color };
};

const getBalanceClass = (status?: string, balance?: number) => {
  if (status === 'Settled' || Number(balance || 0) === 0) return styles.settledText;
  return Number(balance || 0) > 0 ? styles.posText : styles.negText;
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
                <>
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
                            <td className={`${styles.amountCol} ${getBalanceClass(account.status, account.netBalance)}`}>
                              {formatAmount(account.netBalance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.mobileList}>
                    {filteredAccounts.map((account) => (
                      <div 
                        key={account.id} 
                        className={styles.mobileCard}
                        onClick={() => setSelectedAccount(account)}
                      >
                        <div className={styles.mobileCardLeft}>
                          <div className={styles.avatar} style={getAvatarStyle(account.name)}>
                            {getInitials(account.name)}
                          </div>
                          <div className={styles.mobileCardInfo}>
                            <span className={styles.mobileCardName}>{account.name || "Debt Account"}</span>
                            <div className={styles.mobileCardSubtitle}>
                              <span className={styles.mobileCardType}>{account.type || "Personal"}</span>
                              <span className={styles.dot}>•</span>
                              <span className={`
                                ${styles.mobileCardStatus} 
                                ${(account.status || 'Active') === 'Active' ? styles.statusActiveText : styles.statusSettledText}
                              `}>
                                {account.status || 'Active'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.mobileCardRight}>
                          <span className={`${styles.mobileCardAmount} ${getBalanceClass(account.status, account.netBalance)}`}>
                            {formatAmount(account.netBalance)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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
        accounts={accounts as any}
        onAccountAdded={() => undefined}
      />
    </>
  );
}

