'use client';

import React, { useState } from 'react';
import { Plus, CreditCard as CreditCardIcon, CalendarCheck, TrendingUp } from 'lucide-react';
import CreditCardItem from './CreditCardItem';
import AddCreditCardModal from './AddCreditCardModal';
import PageHeaderActions from './PageHeaderActions';
import styles from './CreditCardDashboard.module.css';

export default function CreditCardDashboard({ cards = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('Active');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const totalLimit = cards.reduce((sum, card) => sum + (card.totalLimit || 0), 0);
    const totalBalance = cards.reduce((sum, card) => sum + (card.statementBalance || 0), 0);
    const totalPaid = cards.reduce((sum, card) => sum + (card.totalPaid || 0), 0);
    const totalDue = cards.reduce(
        (sum, card) => sum + Math.max(0, (card.statementBalance || 0) - (card.totalPaid || 0)),
        0
    );
    const availableCredit = Math.max(0, totalLimit - totalBalance);
    const utilization = totalLimit > 0 ? Math.min(100, (totalBalance / totalLimit) * 100) : 0;

    const activeCount = cards.filter(card => {
        const remainingDue = Math.max(0, (card.statementBalance || 0) - (card.totalPaid || 0));
        return remainingDue > 0;
    }).length;
    const inactiveCount = cards.length - activeCount;

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const upcomingDueDates = cards
        .map(card => card.dueDate)
        .filter(Boolean)
        .map(date => new Date(date))
        .filter(date => !Number.isNaN(date.getTime()))
        .filter(date => date >= todayStart)
        .sort((a, b) => a - b);

    const nextDueDate = upcomingDueDates[0];

    const nextDueLabel = nextDueDate
        ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(nextDueDate)
        : 'No upcoming due dates';

    const avgUtilization = cards.length ? cards.reduce((sum, card) => {
        const limit = card.totalLimit || 0;
        const balance = card.statementBalance || 0;
        return sum + (limit ? Math.min(100, (balance / limit) * 100) : 0);
    }, 0) / cards.length : 0;

    const highestBalanceCard = cards
        .slice()
        .sort((a, b) => (b.statementBalance || 0) - (a.statementBalance || 0))[0];

    const filteredCards = cards.filter(card => {
        const matchesSearch =
            (card.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (card.brand || '').toLowerCase().includes(searchQuery.toLowerCase());

        const remainingDue = Math.max(0, (card.statementBalance || 0) - (card.totalPaid || 0));
        const matchesTab = activeTab === 'All' ||
            (activeTab === 'Active' && remainingDue > 0) ||
            (activeTab === 'Inactive' && remainingDue === 0);

        return matchesSearch && matchesTab;
    });

    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <PageHeaderActions
                    title="Credit Cards"
                    subtitle="Track balances, utilization, and statement cycles at a glance."
                    actionLabel="Add Card"
                    onAction={() => setIsModalOpen(true)}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Search cards..."
                    tabs={['Active', 'Inactive', 'All']}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <div className={styles.heroStats}>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Total Due</div>
                        <div className={styles.statValue}>{formatCurrency(totalDue)}</div>
                        <div className={styles.statMeta}>Across {activeCount} active cards</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Available Credit</div>
                        <div className={styles.statValue}>{formatCurrency(availableCredit)}</div>
                        <div className={styles.statMeta}>{utilization.toFixed(1)}% utilization</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Paid This Cycle</div>
                        <div className={styles.statValue}>{formatCurrency(totalPaid)}</div>
                        <div className={styles.statMeta}>Statement balance {formatCurrency(totalBalance)}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Next Due</div>
                        <div className={styles.statValue}>{nextDueLabel}</div>
                        <div className={styles.statMeta}>{inactiveCount} cards paid off</div>
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
                            <span className={styles.insightLabel}>Average utilization</span>
                            <span className={styles.insightValue}>{avgUtilization.toFixed(1)}%</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Highest balance</span>
                            <span className={styles.insightValue}>{formatCurrency(highestBalanceCard?.statementBalance || 0)}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Next due date</span>
                            <span className={styles.insightValue}>{nextDueLabel}</span>
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
                            <span className={styles.insightLabel}>Active cards</span>
                            <span className={styles.insightValue}>{activeCount}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Inactive cards</span>
                            <span className={styles.insightValue}>{inactiveCount}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Total available credit</span>
                            <span className={styles.insightValue}>{formatCurrency(availableCredit)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {filteredCards.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <CreditCardIcon size={32} />
                    </div>
                    <div className={styles.emptyText}>
                        <h3>{searchQuery ? 'No cards found' : 'No cards found'}</h3>
                        <p>{searchQuery ? `No cards matching "${searchQuery}"` : 'Add your first card to start tracking everything money touches.'}</p>
                    </div>
                    {!searchQuery && (
                        <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
                            <Plus size={20} /> Add Your First Card
                        </button>
                    )}
                </div>
            ) : (
                <div className={styles.grid}>
                    {filteredCards.map(card => (
                        <CreditCardItem key={card.id} card={card} />
                    ))}
                </div>
            )}

            <AddCreditCardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
