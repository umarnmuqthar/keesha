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
import PageHeader from './PageHeader';
import StatusBadge from './StatusBadge';

import { useRouter } from 'next/navigation';

export default function KeeshaDashboard({ subscriptions, userProfile }) {
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
    const [activeTab, setActiveTab] = React.useState('All'); // All, Active, Cancelled
    const [searchQuery, setSearchQuery] = React.useState('');

    // Data Processing
    // 1. Filter by Tab
    const tabFiltered = subscriptions.filter(sub => {
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
            const s = status.toLowerCase();
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
    const activeSubs = subscriptions.filter(s => s.status === 'Active' || s.status === 'Free Trial');
    const totalMonthlySpend = activeSubs.reduce((acc, sub) => acc + calculateAmortizedMonthlyCost(sub.currentCost, sub.billingCycle), 0);

    // Nearest Upcoming Bill
    const upcomingBills = activeSubs
        .filter(s => s.nextRenewalDate && new Date(s.nextRenewalDate) >= new Date().setHours(0, 0, 0, 0))
        .sort((a, b) => new Date(a.nextRenewalDate) - new Date(b.nextRenewalDate));
    const nextBill = upcomingBills[0];

    return (
        <div className={styles.container}>
            <PageHeader
                title="My Subscriptions"
                subtitle="Manage all your recurring payments in one place."
                actionLabel="Add New Subscription"
                onAction={() => setIsModalOpen(true)}
            />

            {/* Controls */}
            {/* Controls */}
            <header className={styles.controls}>
                {/* Search */}
                <div className={styles.searchWrapper}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm text-gray-900"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    {['All', 'Active', 'Cancelled'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ''}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            <AddSubscriptionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                existingNames={subscriptions.map(s => s.name)}
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
                                    <h3 className={styles.cardTitle}>{sub.name}</h3>
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
