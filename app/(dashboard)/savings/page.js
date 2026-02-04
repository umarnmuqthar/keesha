'use client';

import React from 'react';
import SavingsDashboard from '@/app/components/SavingsDashboard';

export default function SavingsPage() {
    return (
        <main className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <SavingsDashboard />
            </div>
        </main>
    );
}
