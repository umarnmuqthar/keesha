'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AddButton, Button, Card } from '@/components/ui';
import { useModalState } from '@/components/ui/useModalState';
import { addDebtEntry, deleteDebtAccount, settleDebtAccount } from '@/app/actions/debtActions';
import styles from './debt-detail.module.css';

type Transaction = {
  id: string;
  amount?: number | string;
  type?: 'GIVE' | 'GOT' | string;
  date?: string;
  description?: string;
  status?: string;
};

type DebtDetailClientProps = {
  account: {
    id: string;
    name?: string;
    type?: string;
    status?: string;
  };
  transactions: Transaction[];
  totals: {
    totalGiven: number;
    totalTaken: number;
    netBalance: number;
  };
};

type EntryFormState = {
  amount: string;
  type: 'GIVE' | 'GOT';
  date: string;
  description: string;
};

const formatAmount = (value?: number) => {
  const amount = Math.abs(Number(value || 0));
  return `₹${amount.toLocaleString('en-IN')}`;
};

const formatDate = (raw?: string) => {
  if (!raw) return '-';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export default function DebtDetailClient({ account, transactions, totals }: DebtDetailClientProps) {
  const router = useRouter();
  const addModal = useModalState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [entryForm, setEntryForm] = useState<EntryFormState>({
    amount: '',
    type: 'GIVE',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))),
    [transactions]
  );

  const netLabel = totals.netBalance >= 0 ? 'They owe you' : 'You owe them';

  const handleAddEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(entryForm.amount || 0);
    if (!amount || amount <= 0) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('amount', String(amount));
      formData.append('type', entryForm.type);
      formData.append('date', entryForm.date);
      formData.append('description', entryForm.description || '');

      const result = await addDebtEntry(account.id, formData);
      if (!result.success) throw new Error(result.error || 'Failed to add entry');

      addModal.close();
      setEntryForm({
        amount: '',
        type: 'GIVE',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to add debt entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettle = async () => {
    if (Math.abs(totals.netBalance) < 0.01) return;
    setIsSettling(true);
    try {
      const result = await settleDebtAccount(account.id, totals.netBalance);
      if (!result.success) throw new Error(result.error || 'Failed to settle');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to settle account.');
    } finally {
      setIsSettling(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete this debt account and all entries?');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const result = await deleteDebtAccount(account.id);
      if (!result.success) throw new Error('Failed to delete');
      router.push('/debt');
    } catch (error) {
      console.error(error);
      alert('Failed to delete account.');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className={styles.page}>
        <div className={styles.backRow}>
          <Link href="/debt" className={styles.backLink}>← Back to debt</Link>
        </div>

        <section className={styles.summary}>
          <Card className={styles.summaryCard}>
            <p className={styles.label}>Net balance</p>
            <h3>{formatAmount(totals.netBalance)}</h3>
            <span className={styles.meta}>{netLabel}</span>
          </Card>
          <Card className={styles.summaryCard}>
            <p className={styles.label}>Total given</p>
            <h3>{formatAmount(totals.totalGiven)}</h3>
            <span className={styles.meta}>Amount you lent</span>
          </Card>
          <Card className={styles.summaryCard}>
            <p className={styles.label}>Total taken</p>
            <h3>{formatAmount(totals.totalTaken)}</h3>
            <span className={styles.meta}>Amount you borrowed</span>
          </Card>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Debt ledger</h2>
              <p>Track every transaction with this account.</p>
            </div>
            <div className={styles.actions}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSettle}
                disabled={isSettling || Math.abs(totals.netBalance) < 0.01}
              >
                Settle
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isDeleting}>
                Delete
              </Button>
              <AddButton size="sm" onClick={addModal.open}>Add entry</AddButton>
            </div>
          </div>

          <Card className={styles.tableCard}>
            <div className={styles.tableHead}>
              <span>Date</span>
              <span>Description</span>
              <span>Type</span>
              <span>Status</span>
              <span>Amount</span>
            </div>

            {sortedTransactions.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>No entries yet</h3>
                <p>Add your first debt transaction to start tracking.</p>
              </div>
            ) : (
              sortedTransactions.map((tx) => (
                <div key={tx.id} className={styles.row}>
                  <span>{formatDate(tx.date)}</span>
                  <span>{tx.description || '—'}</span>
                  <span className={tx.type === 'GIVE' ? styles.typeGive : styles.typeGot}>
                    {tx.type || '—'}
                  </span>
                  <span>{tx.status || 'Pending'}</span>
                  <span className={styles.amount}>
                    {tx.type === 'GIVE' ? '+' : '-'} {formatAmount(Number(tx.amount || 0))}
                  </span>
                </div>
              ))
            )}
          </Card>
        </section>
      </div>

      {addModal.isOpen ? (
        <div className={styles.modalOverlay} onClick={addModal.close}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <h3>Add debt entry</h3>
            <p>Record a new GIVE/GOT transaction.</p>

            <form className={styles.modalForm} onSubmit={handleAddEntry}>
              <label>
                Type
                <select
                  value={entryForm.type}
                  onChange={(event) =>
                    setEntryForm((prev) => ({ ...prev, type: event.target.value as 'GIVE' | 'GOT' }))
                  }
                >
                  <option value="GIVE">GIVE</option>
                  <option value="GOT">GOT</option>
                </select>
              </label>

              <label>
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={entryForm.amount}
                  onChange={(event) => setEntryForm((prev) => ({ ...prev, amount: event.target.value }))}
                  required
                />
              </label>

              <label>
                Date
                <input
                  type="date"
                  value={entryForm.date}
                  onChange={(event) => setEntryForm((prev) => ({ ...prev, date: event.target.value }))}
                  required
                />
              </label>

              <label>
                Description
                <input
                  type="text"
                  value={entryForm.description}
                  onChange={(event) =>
                    setEntryForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Optional note"
                />
              </label>

              <div className={styles.modalActions}>
                <Button type="button" variant="ghost" onClick={addModal.close}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Save entry</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
