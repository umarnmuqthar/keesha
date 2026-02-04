'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toggleLoanPayment, recordPayment } from '../actions';
import styles from './UpcomingPaymentsList.module.css';

export default function UpcomingPaymentsList({ items, limit = 5, hideLink = false }) {
    const [loadingId, setLoadingId] = useState(null);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getDayMonth = (dateStr) => {
        const date = new Date(dateStr);
        return {
            day: date.getDate().toString().padStart(2, '0'),
            month: date.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()
        };
    };

    const handleMarkPaid = async (item) => {
        setLoadingId(item.uid);
        try {
            let res;
            if (item.type === 'loan') {
                res = await toggleLoanPayment(item.id, item.date, true);
            } else {
                res = await recordPayment(item.id, item.amount, item.date);
            }

            if (!res.success) {
                alert('Failed to mark as paid: ' + (res.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error marking as paid:', error);
            alert('An error occurred');
        } finally {
            setLoadingId(null);
        }
    };

    if (!items || items.length === 0) {
        return (
            <div className={styles.empty}>
                <p>🎉 No upcoming payments!</p>
            </div>
        );
    }

    const visibleItems = limit ? items.slice(0, limit) : items;

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h3>Upcoming Payments</h3>
                {!hideLink && <Link href="/upcoming" className={styles.link}>See All</Link>}
            </div>

            <div className={styles.list}>
                {visibleItems.map((item) => {
                    const { day, month } = getDayMonth(item.date);
                    return (
                        <div key={item.uid} className={styles.row}>
                            {/* Left: Date Block + Info */}
                            <div className={styles.rowLeft}>
                                <div className={styles.dateBox}>
                                    <span>{month}</span>
                                    <span className={styles.dateDay}>{day}</span>
                                </div>
                                <div className={styles.rowInfo}>
                                    <h4>{item.name}</h4>
                                    <p>
                                        {formatCurrency(item.amount)} • {item.type === 'loan' ? '1 installment due' : item.category}
                                    </p>
                                </div>
                            </div>

                            {/* Right: Mark Paid Button */}
                            <button
                                onClick={() => handleMarkPaid(item)}
                                disabled={loadingId === item.uid}
                                className={`${styles.actionBtn} ${loadingId === item.uid ? styles.disabled : ''}`}
                            >
                                <span className={styles.actionFull}>{loadingId === item.uid ? 'Working...' : 'Mark as Paid'}</span>
                                <span className={styles.actionShort}>{loadingId === item.uid ? '...' : 'Paid'}</span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
