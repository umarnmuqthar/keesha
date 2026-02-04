'use client';

import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import styles from './DashboardTrendChart.module.css';

export default function DashboardTrendChart({ data }) {
    // Expect data to be [{ month: 'Oct', amount: 1200 }, ...]
    // Highlight the last bar (current month)

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className={styles.tooltip}>
                    <p className="font-bold mb-1">{label}</p>
                    <p>₹{payload[0].value.toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    if (!data || data.length === 0) {
        return (
            <div className={styles.card}>
                <div className={styles.header}>
                    <h3>Subscription Spend Trends</h3>
                    <div className={styles.pill}>
                        <span>Last 6 Months</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                </div>
                <div className={styles.empty}>
                    <p>No trend data yet.</p>
                    <span>Add subscriptions to see monthly spend patterns.</span>
                    <a className={styles.emptyCta} href="/subscriptions">Add subscription</a>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h3>Subscription Spend Trends</h3>
                <div className={styles.pill}>
                    <span>Last 6 Months</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </div>
            </div>

            <div className={styles.chart} style={{ minHeight: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barSize={40}>
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#9CA3AF', dy: 10 }}
                        />
                        <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                        <Bar dataKey="amount" radius={[4, 4, 4, 4]}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={index === data.length - 1 ? 'var(--primary)' : 'var(--primary-light)'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
