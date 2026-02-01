'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle2, ChevronRight } from 'lucide-react';
import styles from './CreditCardItem.module.css';

export default function CreditCardItem({ card }) {
    const { id, name, number, brand, totalLimit, statementBalance, totalPaid, dueDate } = card;

    const remainingDue = Math.max(0, statementBalance - totalPaid);
    const usedPercentage = Math.min(100, (statementBalance / totalLimit) * 100);
    const last4 = number.replace(/\s+/g, '').slice(-4);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getDaysRemaining = (dateString) => {
        const diffTime = new Date(dateString) - new Date();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const daysRemaining = getDaysRemaining(dueDate);

    const brandColors = {
        'Visa': '#1a1f71',
        'Mastercard': '#eb001b',
        'RuPay': '#0055a4',
        'Amex': '#27a597',
        'Card': '#374151'
    };

    return (
        <Link href={`/creditcard/${id}`} className={styles.card}>
            <div className={styles.cardTop}>
                <div className={styles.cardInfo}>
                    <h3 title={name}>{name}</h3>
                    <div className={styles.cardNumber}>•••• {last4}</div>
                </div>
                <div
                    className={styles.brandBadge}
                    style={{ backgroundColor: brandColors[brand] || brandColors.Card }}
                >
                    {brand}
                </div>
            </div>

            <div className={styles.utilization}>
                <div className={styles.utilHeader}>
                    <span>Available Credit</span>
                    <span>{formatCurrency(totalLimit - statementBalance)}</span>
                </div>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${usedPercentage}%` }}
                    />
                </div>
            </div>

            <div className={styles.trio}>
                <div className={styles.trioItem}>
                    <div className={styles.label}>Billed</div>
                    <div className={styles.value}>{formatCurrency(statementBalance)}</div>
                </div>
                <div className={styles.trioItem}>
                    <div className={styles.label}>Paid</div>
                    <div className={styles.value}>{formatCurrency(totalPaid)}</div>
                </div>
                <div className={styles.trioItem}>
                    <div className={styles.label}>Due</div>
                    {remainingDue > 0 ? (
                        <div className={`${styles.value} ${styles.dueText}`}>{formatCurrency(remainingDue)}</div>
                    ) : (
                        <div className={styles.settledBadge}>
                            <CheckCircle2 size={14} /> Settled
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.footer}>
                <div className={`${styles.dueDate} ${daysRemaining <= 5 ? styles.dueInSoon : styles.dueInFar}`}>
                    <Calendar size={14} />
                    {daysRemaining > 0 ? `Due in ${daysRemaining} days` : 'Due today'}
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
            </div>
        </Link>
    );
}
