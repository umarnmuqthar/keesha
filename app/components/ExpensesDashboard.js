'use client';

import React, { useMemo, useState } from 'react';
import PageHeaderActions from './PageHeaderActions';
import { CalendarCheck, TrendingDown, Wallet } from 'lucide-react';
import styles from './ExpensesDashboard.module.css';

export default function ExpensesDashboard({ initialExpenses = [] }) {
    const [expenses, setExpenses] = useState(initialExpenses);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('This Month');

    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount || 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLast30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch =
            (expense.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (expense.category || '').toLowerCase().includes(searchQuery.toLowerCase());

        const expenseDate = expense.date ? new Date(expense.date) : null;
        const matchesTab = activeTab === 'All' ||
            (activeTab === 'This Month' && expenseDate && expenseDate >= startOfMonth) ||
            (activeTab === 'Last 30 Days' && expenseDate && expenseDate >= startOfLast30);

        return matchesSearch && matchesTab;
    });

    const monthlyTotal = expenses.reduce((sum, expense) => {
        if (!expense.date) return sum;
        const date = new Date(expense.date);
        return date >= startOfMonth ? sum + (expense.amount || 0) : sum;
    }, 0);

    const last30Total = expenses.reduce((sum, expense) => {
        if (!expense.date) return sum;
        const date = new Date(expense.date);
        return date >= startOfLast30 ? sum + (expense.amount || 0) : sum;
    }, 0);

    const largestExpense = useMemo(() => {
        return expenses
            .slice()
            .sort((a, b) => (b.amount || 0) - (a.amount || 0))[0];
    }, [expenses]);

    const categoryCount = new Set(expenses.map(exp => exp.category).filter(Boolean)).size;

    const avgDaily = last30Total ? last30Total / 30 : 0;

    return (
        <div className={styles.container}>
            <PageHeaderActions
                title="Expenses"
                subtitle="Monitor your spending patterns and upcoming bills."
                actionLabel="Add Expense"
                onAction={() => setIsModalOpen(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search expenses..."
                tabs={['This Month', 'Last 30 Days', 'All']}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <div className={styles.summaryRow}>
                <div className={`${styles.summaryCard} ${styles.primaryCard}`}>
                    <div className={styles.summaryInfo}>
                        <p className={styles.summaryLabel}>SPEND THIS MONTH</p>
                        <h2 className={`${styles.summaryValue} ${styles.primaryText}`}>
                            {formatCurrency(monthlyTotal)}
                        </h2>
                        <p className={styles.summarySubtext}>
                            <TrendingDown size={14} /> {filteredExpenses.length} expenses logged
                        </p>
                    </div>
                    <div className={`${styles.iconCircle} ${styles.primaryBg}`}>
                        <TrendingDown size={24} className={styles.primaryText} />
                    </div>
                </div>
                <div className={`${styles.summaryCard} ${styles.secondaryCard}`}>
                    <div className={styles.summaryInfo}>
                        <p className={styles.summaryLabel}>LAST 30 DAYS</p>
                        <h2 className={`${styles.summaryValue} ${styles.secondaryText}`}>
                            {formatCurrency(last30Total)}
                        </h2>
                        <p className={styles.summarySubtext}>
                            <Wallet size={14} /> Avg daily {formatCurrency(avgDaily)}
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
                            <span className={styles.insightLabel}>Largest expense</span>
                            <span className={styles.insightValue}>{largestExpense?.name || 'No data'}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Largest amount</span>
                            <span className={styles.insightValue}>{formatCurrency(largestExpense?.amount || 0)}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Categories used</span>
                            <span className={styles.insightValue}>{categoryCount}</span>
                        </div>
                    </div>
                </div>
                <div className={styles.insightCard}>
                    <div className={styles.insightHeader}>
                        <span>Breakdown</span>
                        <TrendingDown size={16} />
                    </div>
                    <div className={styles.insightItems}>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Total expenses</span>
                            <span className={styles.insightValue}>{expenses.length}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>This month</span>
                            <span className={styles.insightValue}>{formatCurrency(monthlyTotal)}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Last 30 days</span>
                            <span className={styles.insightValue}>{formatCurrency(last30Total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.grid}>
                {filteredExpenses.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Wallet size={24} />
                        </div>
                        <div>
                            <h3>No expenses recorded yet</h3>
                            <p>Add your first expense to track spending.</p>
                        </div>
                        <button className={styles.emptyAction} onClick={() => setIsModalOpen(true)}>
                            Add Expense
                        </button>
                    </div>
                ) : (
                    filteredExpenses.map(expense => (
                        <div key={expense.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h3 className={styles.cardTitle}>{expense.name}</h3>
                                    <p className={styles.cardSubtitle}>{expense.category || 'General'}</p>
                                </div>
                                <span className={styles.methodBadge}>{expense.paymentMethod || 'Cash'}</span>
                            </div>
                            <div className={styles.cardAmounts}>
                                <div>
                                    <span className={styles.label}>AMOUNT</span>
                                    <span className={styles.value}>{formatCurrency(expense.amount)}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className={styles.label}>DATE</span>
                                    <span className={styles.value}>
                                        {expense.date ? new Date(expense.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.metaRow}>
                                <span>Notes</span>
                                <span>{expense.notes || '—'}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AddExpenseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={(expense) => {
                    setExpenses(prev => [{ ...expense, id: `${Date.now()}` }, ...prev]);
                    setIsModalOpen(false);
                }}
            />
        </div>
    );
}

function AddExpenseModal({ isOpen, onClose, onSave }) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Card');
    const [date, setDate] = useState('');
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            name: name.trim() || 'New Expense',
            category: category.trim(),
            amount: Number(amount || 0),
            paymentMethod,
            date,
            notes: notes.trim()
        });
        setName('');
        setCategory('');
        setAmount('');
        setPaymentMethod('Card');
        setDate('');
        setNotes('');
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2>Add Expense</h2>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>
                <form className={styles.modalBody} onSubmit={handleSubmit}>
                    <label>
                        Merchant / Name
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grocery Store" required />
                    </label>
                    <label>
                        Category
                        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Food" />
                    </label>
                    <label>
                        Amount
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1200" required />
                    </label>
                    <label>
                        Payment Method
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                            <option>Card</option>
                            <option>UPI</option>
                            <option>Cash</option>
                            <option>Bank Transfer</option>
                        </select>
                    </label>
                    <label>
                        Date
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </label>
                    <label>
                        Notes
                        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
                    </label>
                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className={styles.secondaryBtn}>Cancel</button>
                        <button type="submit" className={styles.primaryBtn}>Save Expense</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
