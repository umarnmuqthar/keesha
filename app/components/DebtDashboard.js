'use client';

import React, { useState } from 'react';
import styles from './DebtDashboard.module.css';
import PageHeader from './PageHeader';
import Link from 'next/link';
import AddDebtModal from './AddDebtModal';
import StatusBadge from './StatusBadge';

export default function DebtDashboard({ initialAccounts }) {
    // const [viewMode, setViewMode] = useState('grid'); // Removed viewMode
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
                actionLabel="New Debt Account"
                onAction={() => setIsModalOpen(true)}
            />

            {/* Summary Widgets */}
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    <p className={styles.summaryLabel}>Total to Recover</p>
                    <h2 className={`${styles.summaryValue} ${styles.recoverText}`}>{formatCurrency(totalToRecover)}</h2>
                    <p className={styles.summarySubtext}>Money you lent out</p>
                </div>
                <div className={styles.summaryCard}>
                    <p className={styles.summaryLabel}>Total to Pay</p>
                    <h2 className={`${styles.summaryValue} ${styles.payText}`}>{formatCurrency(totalToPay)}</h2>
                    <p className={styles.summarySubtext}>Money you borrowed</p>
                </div>
            </div>

            {/* Controls - View Toggle Removed */}
            {/* <div className={styles.controls}>...</div> */}

            {/* Main Content - Forced Grid View */}
            <div className={styles.grid}>
                {accounts.map(account => (
                    <Link href={`/debt/${account.id}`} key={account.id} className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>{account.name}</h3>
                            <StatusBadge status={account.status} />
                        </div>

                        <div className={styles.balanceSection}>
                            <p className={styles.balanceLabel}>NET BALANCE</p>
                            <h2 className={`${styles.balanceValue} ${account.netBalance >= 0 ? styles.recoverText : styles.payText}`}>
                                {formatCurrency(account.netBalance)}
                            </h2>
                            <p className={styles.balanceStatus}>
                                {account.netBalance >= 0 ? 'They owe you' : 'You owe them'}
                            </p>
                        </div>

                        <div className={styles.cardFooter}>
                            <span className={styles.lastActivity}>
                                Last activity: {new Date(account.lastInteraction).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>

            <AddDebtModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
