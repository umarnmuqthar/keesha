'use client';

import React, { useState } from 'react';
import styles from './LoanDashboard.module.css';
import PageHeader from './PageHeader';
import AddLoanModal from './AddLoanModal';
import StatusBadge from './StatusBadge';
import Link from 'next/link';

export default function LoanDashboard({ initialLoans }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Active'); // Active, Closed
    const [searchQuery, setSearchQuery] = useState('');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const filteredLoans = initialLoans.filter(loan => {
        const matchesTab = activeTab === 'Active' ? (loan.status || 'Active') === 'Active' : (loan.status || 'Active') === 'Closed';
        const matchesSearch = loan.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const sortedLoans = [...filteredLoans].sort((a, b) => {
        // Helper to find next due date
        const getNextDue = (loan) => {
            const next = (loan.schedule || []).find(p => !loan.payments?.[p.date]);
            return next ? new Date(next.date) : null;
        };

        const dateA = getNextDue(a);
        const dateB = getNextDue(b);

        // Standard sorting: earliest date first
        if (dateA && dateB) return dateA - dateB;

        // Push completed loans (no next due) to the bottom
        if (dateA && !dateB) return -1;
        if (!dateA && dateB) return 1;

        return 0; // Both completed, keep original order
    });

    return (
        <div className={styles.container}>
            <PageHeader
                title="EMI Tracker"
                subtitle="Track your loans and monthly installments."
                actionLabel="Add New Loan"
                onAction={() => setIsModalOpen(true)}
            />

            <div className={styles.controls}>
                <div className={styles.tabs}>
                    {['Active', 'Closed'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ''}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className={styles.searchWrapper}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input
                        type="text"
                        placeholder="Search loans..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm text-gray-900"
                    />
                </div>
            </div>

            <div className={styles.grid}>
                {sortedLoans.map(loan => {
                    const paidAmount = Object.values(loan.payments || {}).length * (loan.emiAmount || 0);
                    const progress = Math.min((paidAmount / loan.totalPayable) * 100, 100);

                    return (
                        <Link href={`/loan/${loan.id}`} key={loan.id} className={styles.card}>
                            <div className={styles.cardContent}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.cardTitle}>{loan.name}</h3>
                                    <StatusBadge status={loan.status || 'Active'} />
                                </div>
                                <div className={styles.cardMainInfo}>
                                    <p className={styles.cardSubtitle}>
                                        Next Due: {(() => {
                                            const nextDue = (loan.schedule || []).find(p => !loan.payments?.[p.date]);
                                            if (!nextDue) return 'Completed';
                                            const date = new Date(nextDue.date);
                                            return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                                        })()}
                                    </p>
                                </div>

                                <div className={styles.cardStatsRow}>
                                    <div>
                                        <span className={styles.label}>MONTHLY EMI</span>
                                        <span className={styles.value}>{formatCurrency(loan.emiAmount)}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span className={styles.label}>TOTAL PAYABLE</span>
                                        <span className={styles.value}>{formatCurrency(loan.totalPayable)}</span>
                                    </div>
                                </div>

                                <div className={styles.progressContainer}>
                                    <div className={styles.progressLabel}>
                                        <span>Progress</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <div className={styles.progressBar}>
                                        <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <AddLoanModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                existingNames={initialLoans.map(l => l.name)}
            />
        </div>
    );
}
