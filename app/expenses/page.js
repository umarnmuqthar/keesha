'use client';

import React from 'react';
import PageHeader from '../components/PageHeader';

export default function ExpensesPage() {
    return (
        <main className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <PageHeader
                    title="Expenses"
                    subtitle="Log and categorize your daily expenses."
                />

                <div style={{ padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid #f3f4f6' }}>
                    <p style={{ color: '#6b7280' }}>Expense logging features coming soon.</p>
                </div>
            </div>
        </main>
    );
}
