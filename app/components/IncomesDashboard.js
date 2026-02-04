'use client';

import React, { useMemo, useState } from 'react';
import PageHeaderActions from './PageHeaderActions';
import { TrendingUp, CalendarCheck, Wallet } from 'lucide-react';
import styles from './IncomesDashboard.module.css';

const toMonthly = (amount, frequency) => {
    const value = amount || 0;
    switch ((frequency || '').toLowerCase()) {
        case 'weekly':
            return value * 4.33;
        case 'bi-weekly':
            return value * 2.16;
        case 'yearly':
            return value / 12;
        case 'one-time':
            return 0;
        default:
            return value;
    }
};

export default function IncomesDashboard({ initialIncomes = [] }) {
    const [incomes, setIncomes] = useState(initialIncomes);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');

    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount || 0);

    const filteredIncomes = incomes.filter(income => {
        const matchesSearch =
            (income.source || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (income.category || '').toLowerCase().includes(searchQuery.toLowerCase());

        const frequency = (income.frequency || 'Monthly').toLowerCase();
        const matchesTab = activeTab === 'All' ||
            (activeTab === 'Recurring' && frequency !== 'one-time') ||
            (activeTab === 'One-Time' && frequency === 'one-time');

        return matchesSearch && matchesTab;
    });

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const monthlyTotal = incomes.reduce((sum, income) => sum + toMonthly(income.amount || 0, income.frequency), 0);
    const oneTimeThisMonth = incomes.reduce((sum, income) => {
        if (!income.date) return sum;
        const dateKey = income.date.slice(0, 7);
        if (dateKey !== currentMonthKey) return sum;
        if ((income.frequency || '').toLowerCase() !== 'one-time') return sum;
        return sum + (income.amount || 0);
    }, 0);

    const topSource = useMemo(() => {
        return incomes
            .map(income => ({ ...income, monthly: toMonthly(income.amount || 0, income.frequency) }))
            .sort((a, b) => b.monthly - a.monthly)[0];
    }, [incomes]);

    const recurringCount = incomes.filter(income => (income.frequency || '').toLowerCase() !== 'one-time').length;

    return (
        <div className={styles.container}>
            <PageHeaderActions
                title="Incomes"
                subtitle="Track recurring and one-time income streams."
                actionLabel="Add Income"
                onAction={() => setIsModalOpen(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search income sources..."
                tabs={['All', 'Recurring', 'One-Time']}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <div className={styles.summaryRow}>
                <div className={`${styles.summaryCard} ${styles.primaryCard}`}>
                    <div className={styles.summaryInfo}>
                        <p className={styles.summaryLabel}>MONTHLY INCOME</p>
                        <h2 className={`${styles.summaryValue} ${styles.primaryText}`}>
                            {formatCurrency(monthlyTotal)}
                        </h2>
                        <p className={styles.summarySubtext}>
                            <TrendingUp size={14} /> {recurringCount} recurring sources
                        </p>
                    </div>
                    <div className={`${styles.iconCircle} ${styles.primaryBg}`}>
                        <TrendingUp size={24} className={styles.primaryText} />
                    </div>
                </div>
                <div className={`${styles.summaryCard} ${styles.secondaryCard}`}>
                    <div className={styles.summaryInfo}>
                        <p className={styles.summaryLabel}>ONE-TIME THIS MONTH</p>
                        <h2 className={`${styles.summaryValue} ${styles.secondaryText}`}>
                            {formatCurrency(oneTimeThisMonth)}
                        </h2>
                        <p className={styles.summarySubtext}>
                            <Wallet size={14} /> {incomes.length - recurringCount} one-time entries
                        </p>
                    </div>
                    <div className={`${styles.iconCircle} ${styles.secondaryBg}`}>
                        <Wallet size={24} className={styles.secondaryText} />
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
                            <span className={styles.insightLabel}>Top source</span>
                            <span className={styles.insightValue}>{topSource?.source || 'No data'}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Top source amount</span>
                            <span className={styles.insightValue}>{formatCurrency(topSource?.amount || 0)}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Average income</span>
                            <span className={styles.insightValue}>{formatCurrency(incomes.length ? monthlyTotal / incomes.length : 0)}</span>
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
                            <span className={styles.insightLabel}>Recurring sources</span>
                            <span className={styles.insightValue}>{recurringCount}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>One-time sources</span>
                            <span className={styles.insightValue}>{incomes.length - recurringCount}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Total sources</span>
                            <span className={styles.insightValue}>{incomes.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.grid}>
                {filteredIncomes.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Wallet size={24} />
                        </div>
                        <div>
                            <h3>No income records yet</h3>
                            <p>Add your first income source to get started.</p>
                        </div>
                        <button className={styles.emptyAction} onClick={() => setIsModalOpen(true)}>
                            Add Income
                        </button>
                    </div>
                ) : (
                    filteredIncomes.map(income => (
                        <div key={income.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h3 className={styles.cardTitle}>{income.source}</h3>
                                    <p className={styles.cardSubtitle}>{income.category || income.frequency}</p>
                                </div>
                                <span className={styles.frequencyBadge}>{income.frequency}</span>
                            </div>
                            <div className={styles.cardAmounts}>
                                <div>
                                    <span className={styles.label}>AMOUNT</span>
                                    <span className={styles.value}>{formatCurrency(income.amount)}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className={styles.label}>MONTHLY</span>
                                    <span className={styles.value}>{formatCurrency(toMonthly(income.amount || 0, income.frequency))}</span>
                                </div>
                            </div>
                            <div className={styles.metaRow}>
                                <span>Last received</span>
                                <span>{income.date ? new Date(income.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A'}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AddIncomeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={(income) => {
                    setIncomes(prev => [{ ...income, id: `${Date.now()}` }, ...prev]);
                    setIsModalOpen(false);
                }}
            />
        </div>
    );
}

function AddIncomeModal({ isOpen, onClose, onSave }) {
    const [source, setSource] = useState('');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState('Monthly');
    const [date, setDate] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            source: source.trim() || 'New Income',
            category: category.trim(),
            amount: Number(amount || 0),
            frequency,
            date
        });
        setSource('');
        setCategory('');
        setAmount('');
        setFrequency('Monthly');
        setDate('');
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2>Add Income</h2>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>
                <form className={styles.modalBody} onSubmit={handleSubmit}>
                    <label>
                        Source
                        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Salary" required />
                    </label>
                    <label>
                        Category
                        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Job" />
                    </label>
                    <label>
                        Amount
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" required />
                    </label>
                    <label>
                        Frequency
                        <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                            <option>Monthly</option>
                            <option>Weekly</option>
                            <option>Bi-Weekly</option>
                            <option>Yearly</option>
                            <option>One-Time</option>
                        </select>
                    </label>
                    <label>
                        Last Received Date
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </label>
                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className={styles.secondaryBtn}>Cancel</button>
                        <button type="submit" className={styles.primaryBtn}>Save Income</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
