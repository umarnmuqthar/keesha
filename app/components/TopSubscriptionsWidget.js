'use client';

import React from 'react';

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
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Top Expensive Subscriptions</h3>

            <div className="space-y-6">
                {topSubs.map((sub, index) => {
                    // Random-ish colors for avatars based on index
                    const bgColors = ['bg-gray-100', 'bg-orange-100', 'bg-green-100', 'bg-purple-100'];
                    const textColors = ['text-gray-600', 'text-orange-600', 'text-green-600', 'text-purple-600'];

                    return (
                        <div key={sub.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${bgColors[index % 4]} ${textColors[index % 4]}`}>
                                    {sub.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{sub.name}</h4>
                                    <p className="text-xs text-gray-500">{sub.category} • {sub.billingCycle}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900">{formatCurrency(sub.currentCost)}</p>
                                <p className="text-xs text-gray-400">{formatDate(sub.nextRenewalDate)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
