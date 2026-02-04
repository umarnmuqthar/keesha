'use client';

import React from 'react';
import styles from './TopSubscriptionsWidget.module.css';

export default function TopSubscriptionsWidget({ subscriptions }) {
    // Expect subscriptions to be sorted by cost descending
    const topSubs = subscriptions.slice(0, 3);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    if (!topSubs || topSubs.length === 0) {
        return (
            <div className={styles.card}>
                <h3>Top Expensive Subscriptions</h3>
                <div className={styles.empty}>
                    <p>No subscriptions found.</p>
                    <span>Add subscriptions to see the highest recurring costs.</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.card}>
            <h3>Top Expensive Subscriptions</h3>

            <div className={styles.list}>
                {topSubs.map((sub, index) => {
                    // Random-ish colors for avatars based on index
                    const bgColors = [styles.avatarGray, styles.avatarOrange, styles.avatarGreen, styles.avatarPurple];
                    const textColors = [styles.textGray, styles.textOrange, styles.textGreen, styles.textPurple];

                    return (
                        <div key={sub.id} className={styles.row}>
                            <div className={styles.rowLeft}>
                                <div className={`${styles.avatar} ${bgColors[index % 4]} ${textColors[index % 4]}`}>
                                    {sub.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className={styles.rowInfo}>
                                    <h4>{sub.name}</h4>
                                    <p>{sub.category} • {sub.billingCycle}</p>
                                </div>
                            </div>
                            <div className={styles.rowRight}>
                                <p>{formatCurrency(sub.currentCost)}</p>
                                <p className={styles.meta}>{formatDate(sub.nextRenewalDate)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
