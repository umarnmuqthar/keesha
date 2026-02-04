'use client';

import React from 'react';
import IncomesDashboard from '@/app/components/IncomesDashboard';

export default function IncomesPage() {
    return (
        <main className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <IncomesDashboard />
            </div>
        </main>
    );
}
