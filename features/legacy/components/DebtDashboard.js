'use client';

import React, { useState, useEffect } from 'react';
import styles from './DebtDashboard.module.css';
import Link from 'next/link';
import AddDebtModal from './AddDebtModal';
import { User, Clock, ChevronRight, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import PageHeaderActions from './PageHeaderActions';
import { CalendarCheck } from 'lucide-react';

export default function DebtDashboard({ initialAccounts = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [accounts, setAccounts] = useState(initialAccounts);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('Active'); // Default to Active as per new order

    const handleAddAccount = (newAccount) => {
        setAccounts(prev => [newAccount, ...prev]);
    };

    // Sync state with props when they change (e.g. after router.refresh)
    useEffect(() => {
        setAccounts(initialAccounts);
    }, [initialAccounts]);


    const filteredAccounts = accounts.filter(acc => {
        const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase());
        // Treat accounts without a status as 'Active'
        const accountStatus = acc.status || 'Active';
        const matchesTab = activeTab === 'All' || accountStatus === activeTab;
        return matchesSearch && matchesTab;
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(Math.abs(amount));
    };

    const totalToRecover = accounts.reduce((sum, curr) => curr.netBalance > 0 ? sum + curr.netBalance : sum, 0);
    const totalToPay = accounts.reduce((sum, curr) => curr.netBalance < 0 ? sum + Math.abs(curr.netBalance) : sum, 0);
    const activeAccounts = accounts.filter(acc => (acc.status || 'Active') === 'Active');
    const closedAccounts = accounts.filter(acc => (acc.status || 'Active') === 'Closed');
    const largestBalance = accounts
        .slice()
        .sort((a, b) => Math.abs(b.netBalance || 0) - Math.abs(a.netBalance || 0))[0];

    return (
        <div className={styles.container}>
            <PageHeaderActions
                title="Debt Tracker"
                subtitle="Manage your lending and borrowings easily."
                actionLabel="New Account"
                onAction={() => setIsModalOpen(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search person or account..."
                tabs={['Active', 'Closed', 'All']}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {/* Summary Widgets */}
            <div className={styles.summaryRow}>
                <div className={`${styles.summaryCard} ${styles.recoverCard}`}>
                    <div className={styles.summaryInfo}>
                        <p className={styles.summaryLabel}>TO RECOVER</p>
                        <h2 className={`${styles.summaryValue} ${styles.recoverText}`}>
                            {formatCurrency(totalToRecover)}
                        </h2>
                        <p className={styles.summarySubtext}>
                            <TrendingUp size={14} /> Money you lent out
                        </p>
                    </div>
                    <div className={`${styles.iconCircle} ${styles.recoverBg}`}>
                        <TrendingUp size={24} className={styles.recoverText} />
                    </div>
                </div>
                <div className={`${styles.summaryCard} ${styles.payCard}`}>
                    <div className={styles.summaryInfo}>
                        <p className={styles.summaryLabel}>TO PAY</p>
                        <h2 className={`${styles.summaryValue} ${styles.payText}`}>
                            {formatCurrency(totalToPay)}
                        </h2>
                        <p className={styles.summarySubtext}>
                            <TrendingDown size={14} /> Money you borrowed
                        </p>
                    </div>
                    <div className={`${styles.iconCircle} ${styles.payBg}`}>
                        <TrendingDown size={24} className={styles.payText} />
                    </div>
                </div>
            </div>

            <div className={styles.insightRow}>
                <div className={styles.insightCard}>
                    <div className={styles.insightHeader}>
                        <span>Insights</span>
                        <CalendarCheck size={16} />
                    </div>
                    <div className={styles.insightItems}>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Active accounts</span>
                            <span className={styles.insightValue}>{activeAccounts.length}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Closed accounts</span>
                            <span className={styles.insightValue}>{closedAccounts.length}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Largest balance</span>
                            <span className={styles.insightValue}>{formatCurrency(largestBalance?.netBalance || 0)}</span>
                        </div>
                    </div>
                </div>
                <div className={styles.insightCard}>
                    <div className={styles.insightHeader}>
                        <span>Breakdown</span>
                        <TrendingUp size={16} />
                    </div>
                    <div className={styles.insightItems}>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>To recover</span>
                            <span className={styles.insightValue}>{formatCurrency(totalToRecover)}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>To pay</span>
                            <span className={styles.insightValue}>{formatCurrency(totalToPay)}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Net balance</span>
                            <span className={styles.insightValue}>{formatCurrency(totalToRecover - totalToPay)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content - Grid View */}
            <div className={styles.accountsGrid}>
                {filteredAccounts.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        {searchQuery ? `No accounts found matching "${searchQuery}"` : 'No debt accounts found. Create one to get started.'}
                    </div>
                ) : (
                    filteredAccounts.map(account => (
                        <Link href={`/debt/${account.id}`} key={account.id} className={styles.accountCard}>
                            <div className={styles.cardLeft}>
                                <h3 className={styles.accountName} title={account.name}>{account.name}</h3>
                                <p className={styles.cardSubtitle}>
                                    Last active: {new Date(account.lastInteraction).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                            </div>

                            <div className={styles.cardRight}>
                                <div className={`${styles.cardAmount} ${account.netBalance > 0 ? styles.recoverText : account.netBalance < 0 ? styles.payText : styles.zeroText}`}>
                                    {formatCurrency(account.netBalance)}
                                </div>
                                {account.netBalance !== 0 && (
                                    <div className={`${styles.statusBadge} ${account.netBalance > 0 ? styles.recoverBadge : styles.payBadge}`}>
                                        {account.netBalance > 0 ? 'THEY OWE' : 'YOU OWE'}
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))
                )}
            </div>

            <AddDebtModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAccountAdded={handleAddAccount}
            />
        </div>
    );
}
