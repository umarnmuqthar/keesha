'use client';

import React, { useState } from 'react';
import styles from './LoanDashboard.module.css';
import AddLoanModal from './AddLoanModal';
import StatusBadge from './StatusBadge';
import Link from 'next/link';
import PageHeaderActions from './PageHeaderActions';

export default function LoanDashboard({ initialLoans = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loans, setLoans] = useState(initialLoans);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('Active'); // Active, Closed, All

    const handleAddLoan = (newLoan) => {
        setLoans(prev => [newLoan, ...prev]);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Filter loans based on search and active tab
    const filteredLoans = loans.filter(loan => {
        const matchesSearch =
            (loan.bankName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (loan.loanType || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTab = activeTab === 'All' || (loan.status || 'Active') === activeTab;
        return matchesSearch && matchesTab;
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
            <PageHeaderActions
                title="EMI Tracker"
                subtitle="Manage your loans and upcoming EMI payments."
                actionLabel="Add EMI"
                onAction={() => setIsModalOpen(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search loans..."
                tabs={['Active', 'Closed', 'All']}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <div className={styles.grid}>
                {sortedLoans.map(loan => {
                    const paidAmount = Object.values(loan.payments || {}).length * (loan.emiAmount || 0);
                    const progress = Math.min((paidAmount / loan.totalPayable) * 100, 100);

                    return (
                        <Link href={`/loans/${loan.id}`} key={loan.id} className={styles.card}>
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
                onLoanAdded={handleAddLoan}
                existingNames={initialLoans.map(l => l.name)}
            />
        </div>
    );
}
