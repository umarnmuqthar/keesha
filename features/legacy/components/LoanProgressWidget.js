'use client';

import React from 'react';
import styles from './LoanProgressWidget.module.css';

export default function LoanProgressWidget({ totalLoanAmount, totalPaid, activeLoansCount, nextDueLoan }) {
    const progress = totalLoanAmount > 0 ? (totalPaid / totalLoanAmount) * 100 : 0;

    // Calculate countdown
    let countdown = 0;
    let dueDateStr = "No active loans";

    if (nextDueLoan) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(nextDueLoan.date);
        due.setHours(0, 0, 0, 0);
        const diffTime = due - today;
        countdown = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        dueDateStr = due.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    return (
        <div className={styles.card}>
            <div>
                <h3>Loan Progress</h3>
                <p>Aggregate across {activeLoansCount} active loans</p>
            </div>

            <div className={styles.ring}>
                <svg width="128" height="128" viewBox="0 0 128 128" className={styles.ringSvg}>
                    <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="var(--primary-light)"
                        strokeWidth="8"
                        fill="transparent"
                    />
                    <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="var(--primary)"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 58}
                        strokeDashoffset={2 * Math.PI * 58 * (1 - progress / 100)}
                        strokeLinecap="round"
                        className={styles.ringProgress}
                    />
                </svg>
                <div className={styles.ringLabel}>
                    <span className={styles.ringValue}>{Math.round(progress)}%</span>
                    <span className={styles.ringMeta}>Paid</span>
                </div>
            </div>

            <div className={styles.footer}>
                <div>
                    <p className={styles.footerLabel}>Nearest Due Date</p>
                    <p className={styles.footerValue}>{dueDateStr}</p>
                </div>
                <div className={styles.footerRight}>
                    <p className={styles.footerLabel}>Countdown</p>
                    <p className={styles.footerValueAccent}>{countdown > 0 ? `${countdown} Days` : 'Due Today'}</p>
                </div>
            </div>
        </div>
    );
}
