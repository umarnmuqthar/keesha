'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader, TabButton, ActionButton } from '@/components/layout/PageHeader';
import { useShellSearch } from '@/components/layout/ShellSearchContext';
import { AddButton, Card, Button } from '@/components/ui';
import { useModalState } from '@/components/ui/useModalState';
import { LayoutDashboard, Zap, Settings } from 'lucide-react';
import AddIncomeModal from './AddIncomeModal';
import IncomeDetailsModal from './IncomeDetailsModal';
import QuickSalaryModal from './QuickSalaryModal';
import SalarySettingsModal from './SalarySettingsModal';
import styles from './incomes.module.css';

interface IncomeEntry {
  id: string;
  source: string;
  amount: number;
  category: string;
  date: string;
  status: string;
  notes?: string;
}

interface UserProfile {
  uid: string;
  baseSalary?: number;
  name?: string;
  email?: string;
}

interface IncomesPageClientProps {
  initialIncomes: IncomeEntry[];
  userProfile: UserProfile | null;
}

const formatAmount = (value?: number) => {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString('en-IN')}`;
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short'
    });
};

export default function IncomesPageClient({ initialIncomes, userProfile }: IncomesPageClientProps) {
  const router = useRouter();
  const addModal = useModalState(false);
  const quickSalaryModal = useModalState(false);
  const settingsModal = useModalState(false);
  
  const [selectedIncome, setSelectedIncome] = useState<IncomeEntry | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'dashboard'>('list');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Received' | 'Pending'>('All');
  const { query: searchQuery } = useShellSearch();
  const query = searchQuery.trim().toLowerCase();

  const handleRefresh = () => {
    router.refresh();
  };

  const filteredByStatus = useMemo(() => {
    if (statusFilter === 'All') return initialIncomes;
    return initialIncomes.filter(inc => inc.status === statusFilter);
  }, [initialIncomes, statusFilter]);

  const filteredIncomes = useMemo(() => {
    if (!query) return filteredByStatus;
    return filteredByStatus.filter((inc) =>
      (inc.source || '').toLowerCase().includes(query) ||
      (inc.category || '').toLowerCase().includes(query)
    );
  }, [filteredByStatus, query]);

  const totalIncome = initialIncomes.reduce(
    (sum, inc) => sum + Number(inc.amount || 0),
    0
  );

  const receivedIncome = initialIncomes
    .filter(inc => inc.status === 'Received')
    .reduce((sum, inc) => sum + Number(inc.amount || 0), 0);

  const baseSalary = userProfile?.baseSalary || 0;

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
                {(['All', 'Received', 'Pending'] as const).map(status => (
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <ActionButton
                    active={viewMode === 'dashboard'}
                    onClick={() => setViewMode(prev => prev === 'dashboard' ? 'list' : 'dashboard')}
                    title="Toggle Dashboard"
                >
                    <LayoutDashboard size={16} />
                </ActionButton>
                <ActionButton
                    onClick={settingsModal.open}
                    title="Salary Settings"
                >
                    <Settings size={16} />
                </ActionButton>
              </div>
            }
            actions={
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={quickSalaryModal.open}
                    style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7' }}
                >
                    <Zap size={16} fill="currentColor" style={{ marginRight: '6px' }} />
                    Quick Salary
                </Button>
                <AddButton size="sm" onClick={addModal.open}>Add income</AddButton>
              </div>
            }
          />
        }
      >
        <div className={styles.page}>
          {viewMode === 'dashboard' && (
            <section className={styles.hero}>
              <div className={styles.heroStats}>
                <Card className={styles.statCard}>
                  <p className={styles.label}>Total Inflow</p>
                  <h3>{formatAmount(totalIncome)}</h3>
                </Card>
                <Card className={styles.statCard}>
                  <p className={styles.label}>Received</p>
                  <h3>{formatAmount(receivedIncome)}</h3>
                </Card>
              </div>
            </section>
          )}

          {viewMode === 'list' && (
            <section className={styles.list}>
              {filteredIncomes.length === 0 ? (
                <Card className={styles.placeholder}>
                  <h3>{query ? 'No matching entries' : 'No income yet'}</h3>
                  <p>
                    {query
                      ? `No record found for "${searchQuery}".`
                      : 'Add your cash inflows to start tracking your revenue.'}
                  </p>
                  {!query ? (
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={quickSalaryModal.open}
                            style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7' }}
                        >
                            <Zap size={16} fill="currentColor" style={{ marginRight: '6px' }} />
                            Quick Salary
                        </Button>
                        <AddButton size="sm" onClick={addModal.open}>Add income</AddButton>
                    </div>
                  ) : null}
                </Card>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.sourceCell}>Source / Origin</th>
                        <th className={styles.categoryCell}>Category</th>
                        <th className={styles.statusCell}>Status</th>
                        <th className={styles.amountCol}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIncomes.map((inc) => (
                        <tr 
                          key={inc.id} 
                          className={styles.tableRow}
                          onClick={() => setSelectedIncome(inc)}
                        >
                          <td className={styles.sourceCell}>
                            <strong>{inc.source}</strong>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{formatDate(inc.date)}</div>
                          </td>
                          <td>{inc.category}</td>
                          <td className={styles.statusCell}>
                            <span className={`
                              ${styles.statusBadge} 
                              ${inc.status === 'Received' ? styles.received : styles.pending}
                            `}>
                              {inc.status}
                            </span>
                          </td>
                          <td className={styles.amountCol}>
                            {formatAmount(inc.amount)}
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

      <IncomeDetailsModal
        income={selectedIncome}
        onClose={() => setSelectedIncome(null)}
        onDeleted={handleRefresh}
      />

      <AddIncomeModal
        isOpen={addModal.isOpen}
        onClose={addModal.close}
        onSuccess={handleRefresh}
      />

      <QuickSalaryModal
        isOpen={quickSalaryModal.isOpen}
        onClose={quickSalaryModal.close}
        baseSalary={baseSalary}
        onSuccess={handleRefresh}
        onOpenSettings={() => {
            quickSalaryModal.close();
            settingsModal.open();
        }}
      />

      <SalarySettingsModal
        isOpen={settingsModal.isOpen}
        onClose={settingsModal.close}
        currentSalary={baseSalary}
        onSuccess={handleRefresh}
      />
    </>
  );
}
