'use client';

import React, { useMemo, useState } from 'react';
import PageHeaderActions from './PageHeaderActions';
import { PiggyBank, Target, TrendingUp } from 'lucide-react';
import styles from './SavingsDashboard.module.css';

export default function SavingsDashboard({ initialGoals = [] }) {
    const [goals, setGoals] = useState(initialGoals);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('Active');

    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount || 0);

    const filteredGoals = goals.filter(goal => {
        const matchesSearch =
            (goal.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (goal.category || '').toLowerCase().includes(searchQuery.toLowerCase());

        const isComplete = (goal.currentAmount || 0) >= (goal.targetAmount || 0);
        const matchesTab = activeTab === 'All' ||
            (activeTab === 'Active' && !isComplete) ||
            (activeTab === 'Completed' && isComplete);

        return matchesSearch && matchesTab;
    });

    const totalSaved = goals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0);
    const totalTarget = goals.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0);
    const completedCount = goals.filter(goal => (goal.currentAmount || 0) >= (goal.targetAmount || 0)).length;
    const activeCount = goals.length - completedCount;
    const overallProgress = totalTarget ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;

    const nextGoal = useMemo(() => {
        return goals
            .filter(goal => (goal.currentAmount || 0) < (goal.targetAmount || 0))
            .map(goal => ({
                ...goal,
                remaining: Math.max(0, (goal.targetAmount || 0) - (goal.currentAmount || 0))
            }))
            .sort((a, b) => a.remaining - b.remaining)[0];
    }, [goals]);

    const avgProgress = goals.length
        ? goals.reduce((sum, goal) => {
            const target = goal.targetAmount || 0;
            const current = goal.currentAmount || 0;
            return sum + (target ? Math.min(100, (current / target) * 100) : 0);
        }, 0) / goals.length
        : 0;

    return (
        <div className={styles.container}>
            <PageHeaderActions
                title="Savings"
                subtitle="Track your goals and keep your progress visible."
                actionLabel="Add Goal"
                onAction={() => setIsModalOpen(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search goals..."
                tabs={['Active', 'Completed', 'All']}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <div className={styles.summaryRow}>
                <div className={`${styles.summaryCard} ${styles.primaryCard}`}>
                    <div className={styles.summaryInfo}>
                        <p className={styles.summaryLabel}>TOTAL SAVED</p>
                        <h2 className={`${styles.summaryValue} ${styles.primaryText}`}>
                            {formatCurrency(totalSaved)}
                        </h2>
                        <p className={styles.summarySubtext}>
                            <PiggyBank size={14} /> Across {activeCount} active goals
                        </p>
                    </div>
                    <div className={`${styles.iconCircle} ${styles.primaryBg}`}>
                        <PiggyBank size={24} className={styles.primaryText} />
                    </div>
                </div>
                <div className={`${styles.summaryCard} ${styles.secondaryCard}`}>
                    <div className={styles.summaryInfo}>
                        <p className={styles.summaryLabel}>TOTAL TARGET</p>
                        <h2 className={`${styles.summaryValue} ${styles.secondaryText}`}>
                            {formatCurrency(totalTarget)}
                        </h2>
                        <p className={styles.summarySubtext}>
                            <Target size={14} /> {completedCount} goals completed
                        </p>
                    </div>
                    <div className={`${styles.iconCircle} ${styles.secondaryBg}`}>
                        <Target size={24} className={styles.secondaryText} />
                    </div>
                </div>
            </div>

            <div className={styles.insightRow}>
                <div className={styles.insightCard}>
                    <div className={styles.insightHeader}>
                        <span>Insights</span>
                        <TrendingUp size={16} />
                    </div>
                    <div className={styles.insightItems}>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Overall progress</span>
                            <span className={styles.insightValue}>{overallProgress.toFixed(1)}%</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Average goal progress</span>
                            <span className={styles.insightValue}>{avgProgress.toFixed(1)}%</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Active goals</span>
                            <span className={styles.insightValue}>{activeCount}</span>
                        </div>
                    </div>
                </div>
                <div className={styles.insightCard}>
                    <div className={styles.insightHeader}>
                        <span>Next Goal</span>
                        <Target size={16} />
                    </div>
                    <div className={styles.insightItems}>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Goal name</span>
                            <span className={styles.insightValue}>{nextGoal?.name || 'No active goals'}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Remaining amount</span>
                            <span className={styles.insightValue}>{formatCurrency(nextGoal?.remaining || 0)}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Target</span>
                            <span className={styles.insightValue}>{formatCurrency(nextGoal?.targetAmount || 0)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.grid}>
                {filteredGoals.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <PiggyBank size={24} />
                        </div>
                        <div>
                            <h3>No savings goals yet</h3>
                            <p>Create your first goal to start tracking progress.</p>
                        </div>
                        <button className={styles.emptyAction} onClick={() => setIsModalOpen(true)}>
                            Add Goal
                        </button>
                    </div>
                ) : (
                    filteredGoals.map(goal => {
                        const target = goal.targetAmount || 0;
                        const current = goal.currentAmount || 0;
                        const progress = target ? Math.min(100, (current / target) * 100) : 0;
                        const isComplete = current >= target && target > 0;

                        return (
                            <div key={goal.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h3 className={styles.cardTitle}>{goal.name}</h3>
                                        <p className={styles.cardSubtitle}>{goal.category || 'General'}</p>
                                    </div>
                                    <span className={`${styles.statusBadge} ${isComplete ? styles.completed : styles.active}`}>
                                        {isComplete ? 'Completed' : 'Active'}
                                    </span>
                                </div>
                                <div className={styles.cardAmounts}>
                                    <div>
                                        <span className={styles.label}>SAVED</span>
                                        <span className={styles.value}>{formatCurrency(current)}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span className={styles.label}>TARGET</span>
                                        <span className={styles.value}>{formatCurrency(target)}</span>
                                    </div>
                                </div>
                                <div className={styles.progressWrapper}>
                                    <div className={styles.progressLabel}>
                                        <span>Progress</span>
                                        <span>{progress.toFixed(0)}%</span>
                                    </div>
                                    <div className={styles.progressBar}>
                                        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <AddSavingsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={(goal) => {
                    setGoals(prev => [{ ...goal, id: `${Date.now()}` }, ...prev]);
                    setIsModalOpen(false);
                }}
            />
        </div>
    );
}

function AddSavingsModal({ isOpen, onClose, onSave }) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [currentAmount, setCurrentAmount] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            name: name.trim() || 'New Goal',
            category: category.trim(),
            targetAmount: Number(targetAmount || 0),
            currentAmount: Number(currentAmount || 0)
        });
        setName('');
        setCategory('');
        setTargetAmount('');
        setCurrentAmount('');
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2>Add Savings Goal</h2>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>
                <form className={styles.modalBody} onSubmit={handleSubmit}>
                    <label>
                        Goal Name
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency Fund" required />
                    </label>
                    <label>
                        Category
                        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Travel" />
                    </label>
                    <label>
                        Target Amount
                        <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="500000" required />
                    </label>
                    <label>
                        Current Amount
                        <input type="number" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} placeholder="120000" />
                    </label>
                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className={styles.secondaryBtn}>Cancel</button>
                        <button type="submit" className={styles.primaryBtn}>Save Goal</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
