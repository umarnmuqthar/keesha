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

    // Nearest Upcoming Bill
    const upcomingBills = activeSubs
        .filter(s => s.nextRenewalDate && new Date(s.nextRenewalDate) >= new Date().setHours(0, 0, 0, 0))
        .sort((a, b) => new Date(a.nextRenewalDate) - new Date(b.nextRenewalDate));
    const nextBill = upcomingBills[0];

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
                            onClick={() => router.push(`/subscription/${sub.id}`)}
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
