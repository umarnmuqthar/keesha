'use client';

import React from 'react';
import PageHeaderActions from '@/app/components/PageHeaderActions';

export default function ExpensesPage() {
    return (
        <main className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <PageHeaderActions
                    title="Expenses"
                />

                <div style={{ padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid #f3f4f6' }}>
                    <p style={{ color: '#6b7280' }}>Expense logging features coming soon.</p>
                </div>
            </div>
        </main>
    );
}
