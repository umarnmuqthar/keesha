'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader, TabButton, ActionButton } from '@/components/layout/PageHeader';
import { useShellSearch } from '@/components/layout/ShellSearchContext';
import { AddButton, Card } from '@/components/ui';
import { useModalState } from '@/components/ui/useModalState';
import { LayoutDashboard, Receipt, TrendingUp } from 'lucide-react';
import styles from './expenses.module.css';
import AddExpenseModal from './AddExpenseModal';
import { format } from 'date-fns';

const formatAmount = (value: any) => {
  return `₹${Math.abs(Number(value || 0)).toLocaleString('en-IN')}`;
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
  if (!name) return { bg: 'linear-gradient(135deg, #e6f4f1 0%, #f6f4f0 100%)', color: '#0f766e' };
  
  const gradients = [
    { bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', color: '#dc2626' }, // Rose/Red
    { bg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', color: '#0284c7' }, // Blue
    { bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', color: '#15803d' }, // Green
    { bg: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)', color: '#a16207' }, // Yellow/Gold
    { bg: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', color: '#7e22ce' }, // Purple
    { bg: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)', color: '#c2410c' }, // Orange
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

type Expense = {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  source?: string;
};

export default function ExpensesPageClient({ initialExpenses }: { initialExpenses: Expense[] }) {
  const modal = useModalState(false);
  const [viewMode, setViewMode] = useState('list');
  const [filter, setFilter] = useState('All');
  const { query: searchQuery } = useShellSearch();
  const query = searchQuery.trim().toLowerCase();

  const filteredExpenses = useMemo(() => {
    let base = [...initialExpenses]; // Clone to avoid mutation
    
    // Client-side Sort: Latest date first
    base.sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      const dateA = Number.isNaN(timeA) ? 0 : timeA;
      const dateB = Number.isNaN(timeB) ? 0 : timeB;
      if (dateB !== dateA) return dateB - dateA;
      // @ts-ignore
      const createdA = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      // @ts-ignore
      const createdB = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const valCreatedA = Number.isNaN(createdA) ? 0 : createdA;
      const valCreatedB = Number.isNaN(createdB) ? 0 : createdB;
      return valCreatedA - valCreatedB;
    });

    if (filter !== 'All') {
      base = base.filter((e: Expense) => e.category === filter);
    }
    if (query) {
      base = base.filter((e: Expense) => 
        (e.description || '').toLowerCase().includes(query) ||
        (e.category || '').toLowerCase().includes(query)
      );
    }
    return base;
  }, [initialExpenses, filter, query]);

  const categories = useMemo(() => {
    const list = Array.from(new Set(initialExpenses.map((e: Expense) => e.category || 'General')));
    return ['All', ...list] as string[];
  }, [initialExpenses]);

  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum: number, e: Expense) => sum + (Number(e.amount) || 0), 0);
    const count = filteredExpenses.length;
    return { total, count };
  }, [filteredExpenses]);

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
                {categories.map((cat: string) => (
                  <TabButton
                    key={cat}
                    active={filter === cat}
                    onClick={() => setFilter(cat)}
                  >
                    {cat}
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
            actions={<AddButton size="sm" onClick={modal.open}>Add Expense</AddButton>}
          />
        }
      >
        <div className={styles.page}>

          <section className={styles.list}>
            {filteredExpenses.length === 0 ? (
              <Card className={styles.placeholder}>
                <h3>No expenses found</h3>
                <p>Record your spending to see it here.</p>
                <AddButton size="sm" onClick={modal.open}>Add first expense</AddButton>
              </Card>
            ) : (
              <>
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.dateCell}>Date</th>
                        <th className={styles.descCell}>Description</th>
                        <th className={styles.catCell}>Category</th>
                        <th className={styles.amountCell}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((expense: Expense) => (
                        <tr key={expense.id} className={styles.tableRow}>
                          <td className={styles.dateCell}>
                              {(() => {
                                if (!expense.date) return '—';
                                const d = new Date(expense.date);
                                if (Number.isNaN(d.getTime())) return String(expense.date);
                                try {
                                  return format(d, 'dd MMM yyyy');
                                } catch {
                                  return String(expense.date);
                                }
                              })()}
                          </td>
                          <td className={styles.descCell}>
                            <strong>{expense.description || "Uncategorized Expense"}</strong>
                            {expense.source === 'Loan' && <span className={styles.autoBadge}>Auto</span>}
                          </td>
                          <td>
                             <span className={styles.catBadge}>{expense.category}</span>
                          </td>
                          <td className={styles.amountCol}>
                            {formatAmount(expense.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.mobileList}>
                  {filteredExpenses.map((expense: Expense) => {
                    const initials = getInitials(expense.category || 'General');
                    const avatarStyle = getAvatarStyle(expense.category || 'General');
                    const formattedDate = (() => {
                      if (!expense.date) return '—';
                      const d = new Date(expense.date);
                      if (Number.isNaN(d.getTime())) return String(expense.date);
                      try {
                        return format(d, 'dd MMM yyyy');
                      } catch {
                        return String(expense.date);
                      }
                    })();

                    return (
                      <div key={expense.id} className={styles.mobileCard}>
                        <div className={styles.mobileCardLeft}>
                          <div 
                            className={styles.avatar}
                            style={{ background: avatarStyle.bg, color: avatarStyle.color }}
                          >
                            {initials}
                          </div>
                          <div className={styles.mobileCardInfo}>
                            <span className={styles.mobileCardName}>
                              {expense.description || "Uncategorized Expense"}
                            </span>
                            <div className={styles.mobileCardSubtitle}>
                              <span className={styles.mobileCardDate}>{formattedDate}</span>
                              <span className={styles.dot}>•</span>
                              <span className={styles.mobileCardCat}>{expense.category || 'General'}</span>
                              {expense.source === 'Loan' && (
                                <>
                                  <span className={styles.dot}>•</span>
                                  <span className={styles.autoBadge}>Auto</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={styles.mobileCardRight}>
                          <span className={styles.mobileCardAmount}>
                            {formatAmount(expense.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>
      </AppShell>

      <AddExpenseModal
        isOpen={modal.isOpen}
        onClose={modal.close}
      />
    </>
  );
}
