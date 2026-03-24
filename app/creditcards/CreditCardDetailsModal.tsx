'use client';

import { useState, useEffect, useTransition } from 'react';
import { 
  X, 
  Plus, 
  History, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2,
  Calendar,
  CreditCard as CardIcon,
  ShieldCheck
} from 'lucide-react';
import { 
  deleteCreditCard, 
  deleteCardTransaction,
  addCardTransaction,
  getCardTransactions
} from '@/app/actions/creditCardActions';
import { Card } from '@/components/ui';
import AddCardTransactionModal from '@/features/legacy/components/AddCardTransactionModal';
import styles from './creditCardDetailsModal.module.css';

type Transaction = {
  id: string;
  type: 'Expense' | 'Payment';
  amount: number;
  date: string;
  description?: string;
};

type CreditCard = {
  id: string;
  name?: string;
  brand?: string;
  number?: string;
  totalLimit?: number;
  statementBalance?: number;
  totalPaid?: number;
  dueDate?: string;
  status?: string;
  transactions?: Transaction[];
};

type CreditCardDetailsModalProps = {
  card: CreditCard | null;
  onClose: () => void;
};

export default function CreditCardDetailsModal({ card, onClose }: CreditCardDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isPending, startTransition] = useTransition();

  const refreshTransactions = async () => {
    if (!card) return;
    setIsLoadingTx(true);
    const txs = await getCardTransactions(card.id);
    setTransactions(txs as any);
    setIsLoadingTx(false);
  };

  // Animation lifecycle and data fetching
  useEffect(() => {
    if (card) {
      setIsOpen(true);
      document.body.style.overflow = 'hidden';
      refreshTransactions();
    } else {
      setIsOpen(false);
      document.body.style.overflow = '';
      setTransactions([]);
    }
  }, [card]);

  if (!card && !isOpen) return null;

  const remainingDue = Math.max(0, (card?.statementBalance || 0) - (card?.totalPaid || 0));
  const last4 = String(card?.number || '').replace(/\s+/g, '').slice(-4);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleDeleteCard = async () => {
    if (!card) return;
    if (!confirm(`Are you sure you want to delete "${card.name}" and all its transactions?`)) return;
    
    setIsDeleting(true);
    const result = await deleteCreditCard(card.id);
    if (result.success) {
      onClose();
    } else {
      alert(result.message || 'Failed to delete card');
      setIsDeleting(false);
    }
  };

  const handleDeleteTx = async (txId: string) => {
    if (!card) return;
    if (!confirm('Delete this transaction?')) return;
    
    startTransition(async () => {
      await deleteCardTransaction(card.id, txId);
      refreshTransactions();
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  return (
    <div className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`} onClick={handleClose}>
      <div 
        className={`${styles.modal} ${isOpen ? styles.modalOpen : ''}`} 
        onClick={e => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconBox}>
              <CardIcon size={24} />
            </div>
            <div>
              <h2 className={styles.title}>{card?.name || 'Credit Card'}</h2>
              <div className={styles.subtitle}>
                •••• {last4} | {card?.brand}
              </div>
            </div>
          </div>
          {/* <button className={styles.editBtn} onClick={() => setIsEditModalOpen(true)}>
            Edit
          </button> */}
          <button className={styles.closeBtn} onClick={handleClose}>
            <X size={20} />
          </button>
        </header>

        <div className={styles.content}>
          <div className={styles.statsGrid}>
            <div className={`${styles.statTile} ${styles.primaryTile}`}>
              <div className={styles.tileHeader}>
                <span>REMAINING DUE</span>
                <TrendingDown size={18} />
              </div>
              <div className={styles.tileValue}>
                {formatCurrency(remainingDue)}
              </div>
              <div className={styles.tileFooter}>
                <ShieldCheck size={14} />
                <span>{remainingDue === 0 ? 'Fully Settled' : 'Payment Required'}</span>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Limit</span>
                <span className={styles.summaryValue}>{formatCurrency(card?.totalLimit || 0)}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Statement Billed</span>
                <span className={styles.summaryValue}>{formatCurrency(card?.statementBalance || 0)}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Paid</span>
                <span className={`${styles.summaryValue} ${styles.paidColor}`}>
                  {formatCurrency(card?.totalPaid || 0)}
                </span>
              </div>
            </div>
          </div>

          <section className={styles.ledgerSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <History size={18} />
                <span>Transaction Ledger</span>
              </div>
              <button 
                className={styles.addTxBtn} 
                onClick={() => setIsTxModalOpen(true)}
              >
                <Plus size={16} />
                <span>Log Entry</span>
              </button>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th className={styles.alignRight}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingTx ? (
                    <tr>
                      <td colSpan={4} className={styles.emptyState}>
                        Loading transactions...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className={styles.emptyState}>
                        No transactions logged for this card yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map(tx => (
                      <tr key={tx.id}>
                        <td className={styles.dateCell}>
                          {new Date(tx.date).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: 'short' 
                          })}
                        </td>
                        <td className={styles.descCell}>
                          {tx.description || (tx.type === 'Expense' ? 'Spend' : 'Payment')}
                        </td>
                        <td>
                          <span className={`
                            ${styles.typeBadge} 
                            ${tx.type === 'Expense' ? styles.expenseBadge : styles.paymentBadge}
                          `}>
                            {tx.type === 'Expense' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                            {tx.type}
                          </span>
                        </td>
                        <td className={`${styles.amountCell} ${tx.type === 'Expense' ? styles.expenseText : styles.paymentText}`}>
                          <div className={styles.amountWrap}>
                            {tx.type === 'Expense' ? '-' : '+'} {formatCurrency(tx.amount)}
                            <button 
                              className={styles.deleteTxBtn}
                              onClick={() => handleDeleteTx(tx.id)}
                              disabled={isPending}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          <button 
            className={styles.destructiveBtn} 
            onClick={handleDeleteCard}
            disabled={isDeleting}
          >
            <Trash2 size={16} />
            <span>Delete Credit Card</span>
          </button>
        </footer>
      </div>

      <AddCardTransactionModal 
        isOpen={isTxModalOpen} 
        onClose={() => {
          setIsTxModalOpen(false);
          refreshTransactions();
        }}
        cardId={card!.id}
      />

      {/* <EditCreditCardModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        card={card}
      /> */}
    </div>
  );
}
