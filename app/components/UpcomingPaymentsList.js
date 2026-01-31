'use client';

import React, { useState } from 'react';
import { toggleLoanPayment, recordPayment } from '../actions';

export default function UpcomingPaymentsList({ items }) {
    const [loadingId, setLoadingId] = useState(null);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getDayMonth = (dateStr) => {
        const date = new Date(dateStr);
        return {
            day: date.getDate().toString().padStart(2, '0'),
            month: date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
        };
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
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
                <p className="text-gray-400">🎉 No upcoming payments!</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Upcoming Payments</h3>
                <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700">See All</a>
            </div>

            <div className="space-y-6">
                {items.slice(0, 5).map((item) => {
                    const { day, month } = getDayMonth(item.date);
                    return (
                        <div key={item.uid} className="flex items-center justify-between group">
                            {/* Left: Date Block + Info */}
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl w-14 h-14 border border-gray-100 text-gray-900">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-0.5">{month}</span>
                                    <span className="text-xl font-bold leading-none">{day}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{item.name}</h4>
                                    <p className="text-xs text-gray-500">
                                        {formatCurrency(item.amount)} • {item.type === 'loan' ? '1 installment due' : item.category}
                                    </p>
                                </div>
                            </div>

                            {/* Right: Mark Paid Button */}
                            <button
                                onClick={() => handleMarkPaid(item)}
                                disabled={loadingId === item.uid}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${loadingId === item.uid
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                                    }`}
                            >
                                {loadingId === item.uid ? 'Working...' : 'Mark as Paid'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
