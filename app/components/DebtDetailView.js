'use client';

import React, { useState } from 'react';
import styles from './DebtDetailView.module.css';
import PageHeader from './PageHeader';
import { settleDebtAccount, deleteDebtAccount } from '../actions/debtActions';
import { useRouter } from 'next/navigation';
import AddDebtEntryModal from './AddDebtEntryModal';
import EditDebtModal from './EditDebtModal';

export default function DebtDetailView({ account }) {
    const router = useRouter();
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { stats, transactions, netBalance } = account;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(Math.abs(amount));
    };

    const handleSettle = async () => {
        if (confirm(`Settle the balance of ${formatCurrency(netBalance)}?`)) {
            await settleDebtAccount(account.id, netBalance);
            router.refresh();
        }
    };

    const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete this account and all its history? This action cannot be undone.`)) {
            await deleteDebtAccount(account.id);
            router.push('/debt');
        }
    };

    const trailingActions = (
        <div className={styles.headerTrailing}>
            <button
                onClick={() => setIsEditModalOpen(true)}
                className={styles.iconBtn}
                title="Edit Account"
                style={{ padding: '8px', fontSize: '1.2rem' }}
            >
                ✏️
            </button>
            <button
                onClick={handleDelete}
                className={`${styles.iconBtn} ${styles.deleteIconBtn}`}
                title="Delete Account"
                style={{ padding: '8px', fontSize: '1.2rem' }}
            >
                🗑️
            </button>
        </div>
    );

    return (
        <div className={styles.container}>
            <PageHeader
                title={account.name}
                subtitle={`Manage your ledger with ${account.name}`}
                backPath="/debt"
                backLabel="Debt Tracker"
                trailingActions={trailingActions}
            />

            {/* Heavy Header Card */}
            <div className={styles.headerCard}>
                <div className={styles.headerTop}>
                    <div>
                        <h2 className={styles.headerTitle}>{account.name}</h2>
                        <div className={styles.statusBadge} data-status={account.status.toLowerCase()}>
                            {account.status}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsEntryModalOpen(true)}
                        className={styles.primaryActionBtn}
                    >
                        <span className={styles.plusSign}>+</span> Add Transaction
                    </button>
                </div>

                <div className={styles.headerStats}>
                    <div className={styles.headerStatItem}>
                        <p className={styles.statLabel}>TOTAL GIVEN</p>
                        <h3 className={styles.statValue}>{formatCurrency(stats.totalGiven)}</h3>
                    </div>
                    <div className={styles.headerStatItem}>
                        <p className={styles.statLabel}>TOTAL TAKEN</p>
                        <h3 className={styles.statValue}>{formatCurrency(stats.totalTaken)}</h3>
                    </div>
                    <div className={styles.headerStatItem}>
                        <p className={styles.statLabel}>NET BALANCE</p>
                        <h3 className={`${styles.statValue} ${netBalance >= 0 ? styles.recoverText : styles.payText}`}>
                            {formatCurrency(netBalance)}
                        </h3>
                        <p className={`${styles.statSubtext} ${netBalance >= 0 ? styles.recoverText : styles.payText}`}>
                            {netBalance >= 0 ? 'They owe you' : 'You owe them'}
                        </p>
                    </div>
                </div>

                <div className={styles.headerFooter}>
                    <button onClick={handleSettle} className={styles.settleButton} disabled={Math.abs(netBalance) < 1}>
                        ✓ Settle Balance
                    </button>
                </div>
            </div>

            {/* Analytics Section */}
            <div className={styles.sectionTitleRow}>
                <h3 className={styles.sectionTitle}>Analytics</h3>
            </div>
            <div className={styles.analyticsGrid}>
                <div className={styles.analyticCard}>
                    <p className={styles.label}>Settled Amount</p>
                    <h2 className={styles.value}>{formatCurrency(stats.settledAmount)}</h2>
                    <p className={styles.subtext}>Total of all cleared entries</p>
                </div>
                {/* Could add more analytics cards here if needed */}
            </div>

            {/* Ledger */}
            <div className={styles.ledgerSection}>
                <h3 className={styles.sectionTitle}>Transaction Ledger</h3>
                <div className={styles.ledgerTable}>
                    {transactions.length === 0 ? (
                        <div className={styles.emptyState}>No transactions yet.</div>
                    ) : (
                        transactions.map(t => (
                            <div key={t.id} className={styles.ledgerRow}>
                                <div className={styles.rowDate}>
                                    <span className={styles.day}>{new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit' })}</span>
                                    <span className={styles.month}>{new Date(t.date).toLocaleDateString('en-GB', { month: 'short' })}</span>
                                </div>
                                <div className={styles.rowMain}>
                                    <p className={styles.rowDesc}>{t.description || 'No description'}</p>
                                    <div className={styles.rowBadges}>
                                        <span className={styles.typeBadge} data-type={t.type}>{t.type}</span>
                                        <span className={styles.statusBadge} data-status={t.status?.toLowerCase()}>{t.status}</span>
                                    </div>
                                </div>
                                <div className={`${styles.rowAmount} ${t.type === 'GIVE' ? styles.giveText : styles.gotText}`}>
                                    {t.type === 'GIVE' ? '+' : '-'} {formatCurrency(t.amount)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

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
        </div>
    );
}
