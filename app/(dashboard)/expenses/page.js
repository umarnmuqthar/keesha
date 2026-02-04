'use client';

import React from 'react';
import ExpensesDashboard from '@/app/components/ExpensesDashboard';

export default function ExpensesPage() {
    return (
        <main className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <ExpensesDashboard />
            </div>
        </main>
    );
}
