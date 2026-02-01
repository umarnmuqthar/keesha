'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, History, TrendingDown, ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';
import { deleteCreditCard, deleteCardTransaction } from '../actions';
import AddCardTransactionModal from './AddCardTransactionModal';
import EditCreditCardModal from './EditCreditCardModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import styles from './CreditCardDetailView.module.css';

export default function CreditCardDetailView({ card, transactions = [] }) {
    const router = useRouter();
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const remainingDue = Math.max(0, card.statementBalance - card.totalPaid);
    const last4 = card.number.replace(/\s+/g, '').slice(-4);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteCreditCard(card.id);
            if (result.success) {
                router.push('/creditcards');
            } else {
                alert(result.message || 'Failed to delete card');
                setIsDeleting(false);
                setIsDeleteModalOpen(false);
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('An unexpected error occurred');
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    const handleDeleteTx = async (txId) => {
        if (confirm('Delete this transaction?')) {
            await deleteCardTransaction(card.id, txId);
            router.refresh();
        }
    };

    return (
        <div className={styles.container}>
            <AddCardTransactionModal
                isOpen={isTxModalOpen}
                onClose={() => setIsTxModalOpen(false)}
                cardId={card.id}
            />
            <EditCreditCardModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                card={card}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Credit Card"
                message={`Are you sure you want to delete "${card.name}" and all its transactions? This action cannot be undone.`}
                disabled={isDeleting}
            />

            <a href="/creditcards" className={styles.backLink}>
                <ArrowLeft size={16} /> Back to Credit Cards
            </a>

            <header className={styles.header}>
                <div>
                    <h1>{card.name}</h1>
                    <div className={styles.subtitle}>•••• {last4} | {card.brand}</div>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.actionBtn} onClick={() => setIsEditModalOpen(true)}>Edit Card</button>
                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => setIsDeleteModalOpen(true)}>
                        <Trash2 size={18} style={{ color: 'var(--danger)' }} />
                    </button>
                </div>
            </header>

            <div className={styles.grid}>
                <div className={`${styles.card} ${styles.vibrantCard}`}>
                    <div className={styles.vibrantHeader}>
                        <span>REMAINING DUE</span>
                        <TrendingDown size={20} />
                    </div>
                    <div className={styles.vibrantValue}>
                        {formatCurrency(remainingDue)}
                    </div>
                    <div className={styles.vibrantSubtext}>
                        {remainingDue === 0 ? 'Fully Settled' : 'Payment Required'}
                    </div>
                </div>

                <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        <span>Total Limit</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(card.totalLimit)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        <span>Statement Billed</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(card.statementBalance)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        <span>Total Paid</span>
                        <span style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(card.totalPaid)}</span>
                    </div>
                </div>
            </div>

            <section className={styles.ledgerSection}>
                <div className={styles.ledgerHeader}>
                    <div className={styles.sectionTitle}>
                        <History size={20} />
                        Transaction Ledger
                    </div>
                    <button className={styles.primaryBtn} onClick={() => setIsTxModalOpen(true)}>
                        <Plus size={18} /> Log Entry
                    </button>
                </div>

                <div className={styles.tableContainer}>
                    <div className={styles.tableHeader}>
                        <span>Date</span>
                        <span>Description</span>
                        <span>Type</span>
                        <span style={{ textAlign: 'right' }}>Amount</span>
                    </div>
                    {transactions.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                            No transactions logged yet.
                        </div>
                    ) : (
                        transactions.map(tx => (
                            <div key={tx.id} className={styles.tableRow}>
                                <div className={styles.dateCell}>
                                    {new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                </div>
                                <div className={styles.descCell}>{tx.description || (tx.type === 'Expense' ? 'Spend' : 'Statement Payment')}</div>
                                <div>
                                    <span className={`${styles.typeBadge} ${tx.type === 'Expense' ? styles.expenseBadge : styles.paymentBadge}`}>
                                        {tx.type === 'Expense' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                        {tx.type}
                                    </span>
                                </div>
                                <div className={`${styles.amountCell} ${tx.type === 'Expense' ? styles.expenseAmount : styles.paymentAmount}`}>
                                    {tx.type === 'Expense' ? '-' : '+'} {formatCurrency(tx.amount)}
                                    <button
                                        onClick={() => handleDeleteTx(tx.id)}
                                        style={{ marginLeft: '1rem', background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
