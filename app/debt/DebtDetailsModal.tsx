'use client';

import { useState, useEffect, useTransition } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { 
  getDebtTransactions, 
  addDebtEntry, 
  settleDebtAccount, 
  deleteDebtAccount,
  updateDebtAccount,
  recalculateDebtBalance
} from '@/app/actions/debtActions';
import { Button, Card, Input } from '@/components/ui';
import styles from './debtDetailsModal.module.css';

type Transaction = {
  id: string;
  amount: number;
  description?: string;
  type: 'GIVE' | 'GOT';
  date: string;
};

type DebtAccount = {
  id: string;
  name?: string;
  type?: string;
  status?: string;
  netBalance?: number;
};

type DebtDetailsModalProps = {
  account: DebtAccount | null;
  onClose: () => void;
};

const formatAmount = (value?: number) => {
  const amount = Math.abs(Number(value || 0));
  return `₹${amount.toLocaleString('en-IN')}`;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export default function DebtDetailsModal({ account, onClose }: DebtDetailsModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [entryType, setEntryType] = useState<'GIVE' | 'GOT'>('GIVE');

  useEffect(() => {
    if (account?.id) {
      loadTransactions();
    }
  }, [account?.id]);

  async function loadTransactions() {
    if (!account?.id) return;
    setIsLoading(true);
    try {
      const data = await getDebtTransactions(account.id);
      setTransactions(data as Transaction[]);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddEntry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!account?.id) return;

    const formData = new FormData(e.currentTarget);
    formData.set('type', entryType);

    startTransition(async () => {
      const result = await addDebtEntry(account.id, formData);
      if (result.success) {
        setShowAddEntry(false);
        loadTransactions();
      }
    });
  };

  const handleSettle = () => {
    if (!account?.id || !account.netBalance) return;
    if (!confirm('Are you sure you want to settle this account? This will add an offsetting transaction.')) return;

    startTransition(async () => {
      const result = await settleDebtAccount(account.id, account.netBalance || 0);
      if (result.success) {
        loadTransactions();
      }
    });
  };

  const handleSync = () => {
    if (!account?.id) return;
    
    startTransition(async () => {
        const result = await recalculateDebtBalance(account.id);
        if (result.success) {
            loadTransactions();
            alert(`Balance synced successfully! New balance: ${formatAmount(result.newBalance)}`);
        }
    });
  };

  const handleDelete = () => {
    if (!account?.id) return;
    if (!confirm('Delete this account and all transactions? This cannot be undone.')) return;

    startTransition(async () => {
      const result = await deleteDebtAccount(account.id);
      if (result.success) {
        onClose();
      }
    });
  };

  if (!account) return null;

  const isOweMe = (account.netBalance || 0) > 0;
  const absBalance = Math.abs(account.netBalance || 0);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.avatar}>
              {account.name?.charAt(0) || 'D'}
            </div>
            <div>
              <h2>{account.name}</h2>
              <span className={styles.accountType}>{account.type} • {account.status}</span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className={styles.balanceSection}>
          <div className={styles.balanceInfo}>
            <p className={styles.balanceLabel}>
              {account.status === 'Settled' ? 'Settled Balance' : (isOweMe ? 'You will get' : 'You will give')}
            </p>
            <h1 className={account.status === 'Settled' ? styles.settledText : (isOweMe ? styles.posBalance : styles.negBalance)}>
              {formatAmount(absBalance)}
              <button 
                className={styles.syncBtn} 
                onClick={handleSync} 
                title="Sync Balance"
                disabled={isPending}
              >
                <CheckCircle2 size={14} className={isPending ? styles.rotating : ''} />
              </button>
            </h1>
          </div>
          <div className={styles.mainActions}>
            <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => { setEntryType('GIVE'); setShowAddEntry(true); }}
                className={styles.giveBtn}
            >
              <ArrowUpRight size={16} /> Give
            </Button>
            <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => { setEntryType('GOT'); setShowAddEntry(true); }}
                className={styles.gotBtn}
            >
              <ArrowDownLeft size={16} /> Got
            </Button>
            {account.status !== 'Settled' && absBalance > 0 && (
                <Button variant="ghost" size="sm" onClick={handleSettle} className={styles.settleBtn}>
                    <CheckCircle2 size={16} /> Settle
                </Button>
            )}
          </div>
        </div>

        {showAddEntry && (
          <Card className={styles.addEntryForm}>
            <form onSubmit={handleAddEntry}>
              <h3>Add {entryType} Entry</h3>
              <div className={styles.formGrid}>
                <Input name="amount" type="number" placeholder="Amount" required autoFocus />
                <Input name="description" placeholder="Description (optional)" />
                <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className={styles.formActions}>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddEntry(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? 'Adding...' : 'Add Entry'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className={styles.tabContent}>
          <h3>History</h3>
          <div className={styles.ledger}>
            {isLoading ? (
              <div className={styles.loading}>Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className={styles.empty}>No transactions yet.</div>
            ) : (
              <table className={styles.ledgerTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th className={styles.amountCol}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td className={styles.dateCol}>{formatDate(t.date)}</td>
                      <td>
                        <div className={styles.descCell}>
                          <span>{t.description || (t.type === 'GIVE' ? 'Amount Given' : 'Amount Received')}</span>
                        </div>
                      </td>
                      <td className={`${styles.amountCol} ${t.type === 'GIVE' ? styles.posText : styles.negText}`}>
                        {t.type === 'GIVE' ? '+ ' : '- '}{formatAmount(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" size="sm" onClick={handleDelete} className={styles.deleteBtn}>
            <Trash2 size={16} /> Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
