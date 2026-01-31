'use client';

import React from 'react';
import PageHeader from '../components/PageHeader';

export default function CreditCardsPage() {
    return (
        <main className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <PageHeader
                    title="Credit Cards"
                    subtitle="Monitor your credit card limits and statement cycles."
                />

                <div style={{ padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid #f3f4f6' }}>
                    <p style={{ color: '#6b7280' }}>Credit card management features coming soon.</p>
                </div>
            </div>
        </main>
    );
}
