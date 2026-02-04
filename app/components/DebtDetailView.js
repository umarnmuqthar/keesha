'use client';

import React, { useState } from 'react';
import styles from './DebtDetailView.module.css';
import { settleDebtAccount, deleteDebtAccount } from '../actions/debtActions';
import { useRouter } from 'next/navigation';
import AddDebtEntryModal from './AddDebtEntryModal';
import EditDebtModal from './EditDebtModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import InternalPageHeader from './InternalPageHeader';
import {
    Edit2,
    Trash2,
    Plus,
    TrendingUp,
    Briefcase,
    History
} from 'lucide-react';

export default function DebtDetailView({ account }) {
    const router = useRouter();
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { stats, transactions, netBalance } = account;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(Math.abs(amount));
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteDebtAccount(account.id);
            if (result.success) {
                router.push('/debt');
            } else {
                alert(result.error || 'Failed to delete account');
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

    return (
        <div className={styles.container}>
            <AddDebtEntryModal
                isOpen={isEntryModalOpen}
                onClose={() => {
                    setIsEntryModalOpen(false);
                    router.refresh();
                }}
                accountId={account.id}
            />

            <EditDebtModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    router.refresh();
                }}
                account={account}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Debt Account"
                message={`Are you sure you want to delete "${account.name}" and all its history? This action cannot be undone.`}
                disabled={isDeleting}
            />

            <InternalPageHeader
                backHref="/debt"
                backLabel="Back to Debt Tracker"
                actions={(
                    <>
                        <button onClick={() => setIsEditModalOpen(true)} className={styles.actionBtn}>
                            <Edit2 size={18} />
                            Edit
                        </button>
                        <button onClick={() => setIsDeleteModalOpen(true)} className={`${styles.actionBtn} ${styles.deleteBtn}`}>
                            <Trash2 size={18} />
                        </button>
                    </>
                )}
            />

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>
                        {account.name}
                        <span className={`${styles.statusBadge} ${account.status === 'Active' ? styles.statusActive : styles.statusClosed}`}>
                            {account.status}
                        </span>
                    </h1>
                    <div className={styles.subtitle}>{`Manage your ledger with ${account.name}`}</div>
                </div>

            </header>

            {/* Grid Area */}
            <div className={styles.grid}>
                {/* Main Overview Card */}
                <div className={styles.card}>
                    <div className={styles.overviewHeader}>
                        <div className={styles.sectionTitle}>
                            <Briefcase size={20} />
                            Account Overview
                        </div>
                        <button
                            onClick={() => setIsEntryModalOpen(true)}
                            className={styles.primaryBtn}
                        >
                            <Plus size={16} />
                            Add Transaction
                        </button>
                    </div>

                    <div className={styles.metricsRow}>
                        <div>
                            <div className={styles.metricLabel}>Total Given</div>
                            <div className={styles.metricValue}>{formatCurrency(stats.totalGiven)}</div>
                        </div>
                        <div>
                            <div className={styles.metricLabel}>Total Taken</div>
                            <div className={styles.metricValue}>{formatCurrency(stats.totalTaken)}</div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className={`${styles.card} ${styles.vibrantCard}`}>
                        <div className={styles.vibrantHeader}>
                            <div className={styles.vibrantLabel}>Net Balance</div>
                            <TrendingUp size={20} style={{ opacity: 0.8 }} />
                        </div>
                        <div className={styles.vibrantValue}>{formatCurrency(netBalance)}</div>
                        <div className={styles.vibrantSubtext}>
                            {netBalance >= 0 ? 'They owe you' : 'You owe them'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction Ledger Section */}
            <div className={styles.ledgerSection}>
                <div className={styles.overviewHeader}>
                    <div className={styles.sectionTitle}>
                        <History size={20} />
                        Transaction Ledger
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <div className={styles.tableHeader}>
                        <div>Date</div>
                        <div>Description / Type</div>
                        <div>Status</div>
                        <div style={{ textAlign: 'right' }}>Amount</div>
                    </div>

                    {transactions.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>No transactions yet.</div>
                    ) : (
                        transactions.map(t => (
                            <div key={t.id} className={styles.tableRow}>
                                <div className={styles.cellDate}>
                                    <span className={styles.day}>{new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit' })}</span>
                                    <span className={styles.month}>{new Date(t.date).toLocaleDateString('en-GB', { month: 'short' })}</span>
                                </div>
                                <div>
                                    <div className={styles.rowDesc}>{t.description || 'Other'}</div>
                                    <span className={`${styles.typeBadge} ${t.type === 'GIVE' ? styles.typeGIVE : styles.typeGOT}`}>
                                        {t.type}
                                    </span>
                                </div>
                                <div>
                                        <span className={styles.statusBadge} style={{ background: t.status === 'Settled' ? 'var(--primary-light)' : '#f3f4f6', color: t.status === 'Settled' ? 'var(--primary)' : '#6b7280' }}>
                                        {t.status}
                                    </span>
                                </div>
                                <div className={`${styles.rowAmount} ${t.type === 'GIVE' ? styles.giveText : styles.gotText}`}>
                                    {t.type === 'GIVE' ? '+' : '-'} {formatCurrency(t.amount)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
