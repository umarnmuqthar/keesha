'use client';

import React, { useState } from 'react';
import styles from './DebtDashboard.module.css';
import PageHeader from './PageHeader';
import Link from 'next/link';
import AddDebtModal from './AddDebtModal';
import { User, Clock, ChevronRight } from 'lucide-react';

export default function DebtDashboard({ initialAccounts }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [accounts] = useState(initialAccounts);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(Math.abs(amount));
    };

    const totalToRecover = accounts.reduce((acc, curr) => curr.netBalance > 0 ? acc + curr.netBalance : acc, 0);
    const totalToPay = accounts.reduce((acc, curr) => curr.netBalance < 0 ? acc + Math.abs(curr.netBalance) : acc, 0);

    return (
        <div className={styles.container}>
            <PageHeader
                title="Debt Tracker"
                subtitle="Manage personal lending and borrowing effortlessly."
                actionLabel="New Account"
                onAction={() => setIsModalOpen(true)}
            />

            {/* Summary Widgets */}
            <div className={styles.summaryRow}>
                <div className={styles.summaryCard}>
                    <p className={styles.summaryLabel}>To Recover</p>
                    <h2 className={`${styles.summaryValue} ${styles.recoverText}`}>{formatCurrency(totalToRecover)}</h2>
                    <p className={styles.summarySubtext}>Money you lent out</p>
                </div>
                <div className={styles.summaryCard}>
                    <p className={styles.summaryLabel}>To Pay</p>
                    <h2 className={`${styles.summaryValue} ${styles.payText}`}>{formatCurrency(totalToPay)}</h2>
                    <p className={styles.summarySubtext}>Money you borrowed</p>
                </div>
            </div>

            {/* Content - List View */}
            <div className={styles.listContainer}>
                {accounts.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        No debt accounts found. Create one to get started.
                    </div>
                ) : (
                    accounts.map(account => (
                        <Link href={`/debt/${account.id}`} key={account.id} className={styles.listRow}>
                            <div className={styles.accountInfo}>
                                <div className={styles.accountName}>{account.name}</div>
                                <div className={styles.accountSubtitle}>
                                    <Clock size={12} />
                                    Last active: {new Date(account.lastInteraction).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                <div className={styles.balanceInfo}>
                                    <div className={`${styles.balanceValue} ${account.netBalance >= 0 ? styles.recoverText : styles.payText}`}>
                                        {formatCurrency(account.netBalance)}
                                    </div>
                                    <div className={styles.balanceLabel} style={{ color: account.netBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                        {account.netBalance >= 0 ? 'They owe you' : 'You owe them'}
                                    </div>
                                </div>
                                <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
                            </div>
                        </Link>
                    ))
                )}
            </div>

            <AddDebtModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}

