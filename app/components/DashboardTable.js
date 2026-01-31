'use client';

import React, { useState } from 'react';
import { toggleLoanPayment, recordPayment } from '../actions';

export default function DashboardTable({ items }) {
    const [loadingId, setLoadingId] = useState(null);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const handleMarkPaid = async (item) => {
        setLoadingId(item.uid);
        try {
            let res;
            if (item.type === 'loan') {
                res = await toggleLoanPayment(item.id, item.date, true);
            } else {
                res = await recordPayment(item.id, item.amount, item.date);
            }

            if (!res.success) {
                alert('Failed to mark as paid: ' + (res.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error marking as paid:', error);
            alert('An error occurred');
        } finally {
            setLoadingId(null);
        }
    };

    if (!items || items.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <p className="text-gray-400 text-lg">🎉 No upcoming payments in the next 30 days!</p>
            </div>
        );
    }

    return (
        <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Upcoming Payments</h3>

            <div className="space-y-4">
                {items.map((item) => (
                    <div
                        key={item.uid}
                        className="bg-white rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                    >
                        {/* Left: Icon & Name */}
                        <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${item.type === 'loan'
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : 'bg-blue-100 text-blue-600'
                                }`}>
                                {item.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg">{item.name}</h4>
                                <p className="text-sm text-gray-500 font-medium">{item.category || item.type}</p>
                            </div>
                        </div>

                        {/* Middle: Status Badge */}
                        <div className="hidden md:block">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${item.type === 'loan'
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-blue-50 text-blue-600'
                                }`}>
                                Active
                            </span>
                        </div>

                        {/* Right: Cost & Action */}
                        <div className="flex items-center gap-8">
                            <div className="text-right">
                                <p className="text-xl font-bold text-gray-900">{formatCurrency(item.amount)}</p>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Due {formatDate(item.date)}</p>
                            </div>

                            <button
                                onClick={() => handleMarkPaid(item)}
                                disabled={loadingId === item.uid}
                                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${loadingId === item.uid
                                        ? 'bg-gray-100 text-gray-300'
                                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                                    }`}
                                title="Mark as Paid"
                            >
                                {loadingId === item.uid ? (
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 text-center">
                <a href="/subscriptions" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
                    View All Subscriptions <span className="ml-1">→</span>
                </a>
            </div>
        </div>
    );
}
