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
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateB !== dateA) return dateB - dateA;
      // Secondary sort by createdAt (assuming it exists in data, though not in type)
      // @ts-ignore
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
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
                           {format(new Date(expense.date), 'dd MMM yyyy')}
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
