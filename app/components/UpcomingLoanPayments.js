'use client';

import React, { useState } from 'react';
import { toggleLoanPayment } from '../actions';

export default function UpcomingLoanPayments({ payments }) {
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
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    };

    const handleMarkAsPaid = async (loanId, date) => {
        setLoadingId(`${loanId}-${date}`);
        try {
            const res = await toggleLoanPayment(loanId, date, true);
            if (!res.success) {
                alert('Failed to mark as paid');
            }
        } catch (error) {
            console.error('Error marking as paid:', error);
            alert('An error occurred');
        } finally {
            setLoadingId(null);
        }
    };

    if (payments.length === 0) {
        return (
            <div className="p-10 text-center">
                <p className="text-gray-500 mb-2">🎉 No upcoming loan EMIs in the next 30 days!</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-50">
            {payments.slice(0, 5).map((payment) => (
                <div key={`${payment.loanId}-${payment.date}`} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                            {payment.loanName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">{payment.loanName}</h4>
                            <p className="text-xs text-gray-500">EMI Payment</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                            <p className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded-full inline-block mt-1">Due {formatDate(payment.date)}</p>
                        </div>
                        <button
                            onClick={() => handleMarkAsPaid(payment.loanId, payment.date)}
                            disabled={loadingId === `${payment.loanId}-${payment.date}`}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${loadingId === `${payment.loanId}-${payment.date}`
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-100'
                                }`}
                        >
                            {loadingId === `${payment.loanId}-${payment.date}` ? '...' : 'Mark Paid'}
                        </button>
                    </div>
                </div>
            ))}
            {payments.length > 5 && (
                <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
                    <span className="text-xs text-gray-500">And {payments.length - 5} more...</span>
                </div>
            )}
        </div>
    );
}
