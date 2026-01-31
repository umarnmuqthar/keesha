'use client';

import React from 'react';

export default function LoanProgressWidget({ totalLoanAmount, totalPaid, activeLoansCount, nextDueLoan }) {
    const progress = totalLoanAmount > 0 ? (totalPaid / totalLoanAmount) * 100 : 0;

    // Calculate countdown
    let countdown = 0;
    let dueDateStr = "No active loans";

    if (nextDueLoan) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(nextDueLoan.date);
        due.setHours(0, 0, 0, 0);
        const diffTime = due - today;
        countdown = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        dueDateStr = due.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col justify-between">
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Loan Progress</h3>
                <p className="text-xs text-gray-500">Aggregate across {activeLoansCount} active loans</p>
            </div>

            <div className="py-8 flex justify-center items-center relative">
                <svg width="128" height="128" viewBox="0 0 128 128" className="transform -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="#F3F4F6"
                        strokeWidth="8"
                        fill="transparent"
                    />
                    <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="#FF385C"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 58}
                        strokeDashoffset={2 * Math.PI * 58 * (1 - progress / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{Math.round(progress)}%</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Paid</span>
                </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
                <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Nearest Due Date</p>
                    <p className="text-lg font-bold text-gray-900">{dueDateStr}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium mb-1">Countdown</p>
                    <p className="text-lg font-bold text-red-500">{countdown > 0 ? `${countdown} Days` : 'Due Today'}</p>
                </div>
            </div>
        </div>
    );
}
