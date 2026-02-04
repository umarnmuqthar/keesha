'use client';

import Link from 'next/link';
import React from 'react';
import styles from './KeeshaDashboard.module.css';
import {
    calculateDaysUntilDue,
    getSubscriptionInsights,
    calculateAmortizedMonthlyCost
} from '@/lib/keesha-logic';
import AddSubscriptionModal from './AddSubscriptionModal';
import StatusBadge from './StatusBadge';
import PageHeaderActions from './PageHeaderActions';
import { CalendarCheck, TrendingUp, Wallet } from 'lucide-react';

import { useRouter } from 'next/navigation';

export default function KeeshaDashboard({ subscriptions: initialSubscriptions = [] }) {
    const router = useRouter();

    // Helper functions
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // State
    // State
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState('Active'); // Active, Cancelled, All
    const [searchQuery, setSearchQuery] = React.useState('');

    // Data Processing
    // 1. Filter by Tab
    const tabFiltered = initialSubscriptions.filter(sub => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Active') return sub.status === 'Active' || sub.status === 'Free Trial';
        if (activeTab === 'Cancelled') return sub.status === 'Cancelled' || sub.status === 'Expired';
        return true;
    });

    // 2. Filter by Search
    const finalFiltered = tabFiltered.filter(sub =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.category && sub.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // 3. Enhance with Insights & Sort
    const processedData = finalFiltered.map(sub => {
        const daysUntilDue = calculateDaysUntilDue(sub.nextRenewalDate);
        const { alerts, badge } = getSubscriptionInsights(sub);
        const amortizedCost = calculateAmortizedMonthlyCost(sub.currentCost, sub.billingCycle);
        const isTrial = sub.status === 'Free Trial' || (sub.trialEndDate && new Date(sub.trialEndDate) > new Date());
        return { ...sub, daysUntilDue, alerts, insightsBadge: badge, amortizedCost, isTrial };
    }).sort((a, b) => {
        // Primary Sort: Status Priority (Active First, Cancelled/Expired Last)
        const getPriority = (status) => {
            const s = (status || '').toLowerCase();
            if (s === 'active' || s === 'free trial') return 1;
            return 2; // Cancelled, Expired, etc.
        };
        const priorityA = getPriority(a.status);
        const priorityB = getPriority(b.status);

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        // Secondary Sort: Due Date (Sooner first)
        if (!a.nextRenewalDate) return 1;
        if (!b.nextRenewalDate) return -1;
        return a.daysUntilDue - b.daysUntilDue;
    });

    // Stats Calculation
    const activeSubs = initialSubscriptions.filter(s => s.status === 'Active' || s.status === 'Free Trial');
    const totalMonthlySpend = activeSubs.reduce((acc, sub) => acc + calculateAmortizedMonthlyCost(sub.currentCost, sub.billingCycle), 0);
    const highestMonthly = activeSubs.reduce((max, sub) => Math.max(max, calculateAmortizedMonthlyCost(sub.currentCost, sub.billingCycle)), 0);
    const avgMonthly = activeSubs.length ? totalMonthlySpend / activeSubs.length : 0;
    const trialCount = activeSubs.filter(sub =>
        sub.status === 'Free Trial' || (sub.trialEndDate && new Date(sub.trialEndDate) > new Date())
    ).length;

    // Nearest Upcoming Bill
    const upcomingBills = activeSubs
        .filter(s => s.nextRenewalDate && new Date(s.nextRenewalDate) >= new Date().setHours(0, 0, 0, 0))
        .sort((a, b) => new Date(a.nextRenewalDate) - new Date(b.nextRenewalDate));
    const nextBill = upcomingBills[0];
    const nextBillAmount = nextBill ? calculateAmortizedMonthlyCost(nextBill.currentCost, nextBill.billingCycle) : 0;

    return (
        <div className={styles.container}>
            <PageHeaderActions
                title="My Subscriptions"
                subtitle="Track your recurring payments and renewals."
                actionLabel="Add Subscription"
                onAction={() => setIsModalOpen(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search subscriptions..."
                tabs={['Active', 'Cancelled', 'All']}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <div className={styles.summaryRow}>
                <div className={`${styles.summaryCard} ${styles.spendCard}`}>
                    <div className={styles.summaryInfo}>
                        <p className={styles.summaryLabel}>MONTHLY SPEND</p>
                        <h2 className={`${styles.summaryValue} ${styles.spendText}`}>
                            {formatCurrency(totalMonthlySpend)}
                        </h2>
                        <p className={styles.summarySubtext}>
                            <TrendingUp size={14} /> Across {activeSubs.length} active subscriptions
                        </p>
                    </div>
                    <div className={`${styles.iconCircle} ${styles.spendBg}`}>
                        <TrendingUp size={24} className={styles.spendText} />
                    </div>
                </div>
                <div className={`${styles.summaryCard} ${styles.averageCard}`}>
                    <div className={styles.summaryInfo}>
                        <p className={styles.summaryLabel}>AVERAGE COST</p>
                        <h2 className={`${styles.summaryValue} ${styles.averageText}`}>
                            {formatCurrency(avgMonthly)}
                        </h2>
                        <p className={styles.summarySubtext}>
                            <Wallet size={14} /> Highest {formatCurrency(highestMonthly)}
                        </p>
                    </div>
                    <div className={`${styles.iconCircle} ${styles.averageBg}`}>
                        <Wallet size={24} className={styles.averageText} />
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
                            <span className={styles.insightLabel}>Next bill</span>
                            <span className={styles.insightValue}>
                                {nextBill ? new Date(nextBill.nextRenewalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'No upcoming'}
                            </span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Next bill amount</span>
                            <span className={styles.insightValue}>{formatCurrency(nextBillAmount)}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Trials running</span>
                            <span className={styles.insightValue}>{trialCount}</span>
                        </div>
                    </div>
                </div>
                <div className={styles.insightCard}>
                    <div className={styles.insightHeader}>
                        <span>Spend Breakdown</span>
                        <TrendingUp size={16} />
                    </div>
                    <div className={styles.insightItems}>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Active subscriptions</span>
                            <span className={styles.insightValue}>{activeSubs.length}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Monthly total</span>
                            <span className={styles.insightValue}>{formatCurrency(totalMonthlySpend)}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Average per subscription</span>
                            <span className={styles.insightValue}>{formatCurrency(avgMonthly)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <AddSubscriptionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                existingNames={initialSubscriptions.map(s => s.name)}
            />


            <div className={styles.grid}>
                {processedData.map((sub) => {
                    return (
                        <div
                            key={sub.id}
                            className={styles.card}
                            onClick={() => router.push(`/subscriptions/${sub.id}`)}
                        >
                            <div className={styles.cardContent}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.cardTitle} title={sub.name}>{sub.name}</h3>
                                    <StatusBadge status={sub.status} />
                                </div>

                                <div className={styles.cardMainInfo}>
                                    <p className={styles.cardSubtitle}>
                                        Next Due: {sub.nextRenewalDate ? new Date(sub.nextRenewalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A'}
                                    </p>
                                </div>

                                <div className={styles.cardStatsRow}>
                                    <div>
                                        <span className={styles.label}>MONTHLY PRICE</span>
                                        <div className={styles.value}>
                                            {formatCurrency(sub.amortizedCost)}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span className={styles.label}>BILLING CYCLE</span>
                                        <div className={styles.value}>
                                            {sub.billingCycle.toUpperCase()}
                                        </div>
                                    </div>
                                </div>

                                {sub.status === 'Active' && sub.daysUntilDue !== null && (
                                    <div className={styles.dueNotice} data-urgent={sub.daysUntilDue <= 3} style={{ marginTop: '0.75rem' }}>
                                        {sub.daysUntilDue <= 0 ? 'Overdue' : `Due in ${sub.daysUntilDue} days`}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div >
    );
}
