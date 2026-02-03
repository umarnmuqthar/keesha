'use client';

import React from 'react';
import PageHeaderActions from '@/app/components/PageHeaderActions';

export default function IncomesPage() {
    return (
        <main className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <PageHeaderActions
                    title="Incomes"
                />

                <div style={{ padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid #f3f4f6' }}>
                    <p style={{ color: '#6b7280' }}>Income tracking features coming soon.</p>
                </div>
            </div>
        </main>
    );
}
