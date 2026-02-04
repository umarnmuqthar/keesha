'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addLoan } from '../actions';
import PageHeaderActions from './PageHeaderActions';
import { TrendingUp, CalendarCheck, Wallet } from 'lucide-react';
import styles from './LoanTracker.module.css';

export default function LoanTracker({ initialLoans }) {
    const router = useRouter();
    const [loans, setLoans] = useState(initialLoans);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // For specific month view, let's just show next 12 months for now?
    // Or user wants a spreadsheet: Loan Name vs Month.

    // Generate next 12 months
    const months = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
        months.push(d);
    }

    const formatMonth = (date) => date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    // Formatting currency
    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

    const totalPayable = loans.reduce((sum, loan) => sum + (loan.totalPayable || 0), 0);
    const totalMonthlyEmi = loans.reduce((sum, loan) => sum + (loan.emiAmount || 0), 0);
    const highestEmi = loans.reduce((max, loan) => Math.max(max, loan.emiAmount || 0), 0);

    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const currentMonthKey = `${currentYear}-${currentMonth}`;
    const paidThisMonth = loans.reduce((sum, loan) => {
        const isPaid = loan.payments && loan.payments[currentMonthKey];
        return sum + (isPaid ? (loan.emiAmount || 0) : 0);
    }, 0);
    const remainingThisMonth = Math.max(0, totalMonthlyEmi - paidThisMonth);
    const paidCountThisMonth = loans.filter(loan => loan.payments && loan.payments[currentMonthKey]).length;

    return (
        <div className={styles.container}>
            <PageHeaderActions
                title="EMI Tracker"
                subtitle="Track monthly EMIs and upcoming payments."
                actionLabel="Add New Loan"
                onAction={() => setIsModalOpen(true)}
            />

            <div className={styles.summaryRow}>
                <div className={`${styles.summaryCard} ${styles.emiCard}`}>
                    <div className={styles.summaryInfo}>
                        <p className={styles.summaryLabel}>TOTAL PAYABLE</p>
                        <h2 className={`${styles.summaryValue} ${styles.emiText}`}>
                            {formatCurrency(totalPayable)}
                        </h2>
                        <p className={styles.summarySubtext}>
                            <TrendingUp size={14} /> Across {loans.length} loans
                        </p>
                    </div>
                    <div className={`${styles.iconCircle} ${styles.emiBg}`}>
                        <TrendingUp size={24} className={styles.emiText} />
                    </div>
                </div>
                <div className={`${styles.summaryCard} ${styles.monthlyCard}`}>
                    <div className={styles.summaryInfo}>
                        <p className={styles.summaryLabel}>MONTHLY EMI</p>
                        <h2 className={`${styles.summaryValue} ${styles.monthlyText}`}>
                            {formatCurrency(totalMonthlyEmi)}
                        </h2>
                        <p className={styles.summarySubtext}>
                            <Wallet size={14} /> Highest EMI {formatCurrency(highestEmi)}
                        </p>
                    </div>
                    <div className={`${styles.iconCircle} ${styles.monthlyBg}`}>
                        <Wallet size={24} className={styles.monthlyText} />
                    </div>
                </div>
            </div>

            <div className={styles.insightRow}>
                <div className={styles.insightCard}>
                    <div className={styles.insightHeader}>
                        <span>Insights</span>
                        <CalendarCheck size={16} />
                    </div>
                    <div className={styles.insightItems}>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Paid this month</span>
                            <span className={styles.insightValue}>{formatCurrency(paidThisMonth)}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Remaining this month</span>
                            <span className={styles.insightValue}>{formatCurrency(remainingThisMonth)}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Loans paid this month</span>
                            <span className={styles.insightValue}>{paidCountThisMonth}/{loans.length}</span>
                        </div>
                    </div>
                </div>
                <div className={styles.insightCard}>
                    <div className={styles.insightHeader}>
                        <span>Next 12 Months</span>
                        <TrendingUp size={16} />
                    </div>
                    <div className={styles.insightItems}>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Total EMI exposure</span>
                            <span className={styles.insightValue}>{formatCurrency(totalMonthlyEmi * 12)}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Average EMI</span>
                            <span className={styles.insightValue}>{formatCurrency(loans.length ? totalMonthlyEmi / loans.length : 0)}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span className={styles.insightLabel}>Highest EMI</span>
                            <span className={styles.insightValue}>{formatCurrency(highestEmi)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-semibold sticky left-0 bg-gray-50 z-10 border-r border-gray-100 min-w-[200px]">
                                    Loan Name
                                </th>
                                <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap bg-gray-50">Total Payable</th>
                                {months.map(m => (
                                    <th key={m.getTime()} scope="col" className="px-6 py-4 text-center min-w-[120px] font-semibold">
                                        {formatMonth(m)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loans.map(loan => (
                                <tr key={loan.id} className="bg-white border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                    <td className="px-6 py-5 font-medium text-gray-900 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                        <div className="flex flex-col">
                                            <span className="text-base font-semibold text-gray-800">{loan.name}</span>
                                            <span className="text-xs text-gray-400 mt-0.5">Due {loan.dueDate}{loan.dueDate === 1 ? 'st' : loan.dueDate === 2 ? 'nd' : loan.dueDate === 3 ? 'rd' : 'th'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-medium text-gray-700 bg-gray-50/30">
                                        {formatCurrency(loan.totalPayable)}
                                    </td>
                                    {months.map(m => {
                                        // Logic to key by YYYY-MM
                                        const year = m.getFullYear();
                                        const month = String(m.getMonth() + 1).padStart(2, '0');
                                        const monthKey = `${year}-${month}`;

                                        const amount = loan.emiAmount || 0;
                                        const isPaid = loan.payments && loan.payments[monthKey];

                                        return (
                                            <td key={m.getTime()} className="px-4 py-5 text-center border-l border-gray-50">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className={`text-sm font-medium ${isPaid ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-900'}`}>
                                                        {formatCurrency(amount)}
                                                    </span>
                                                    {/* We need a toggle function passed from page or imported action wrapper */}
                                                    {/* Check if we have toggleLoanPayment imported? No, it's a server action. 
                                                        We need to handle it. For now, assuming parent or self implementation */}
                                                    <button
                                                        onClick={async () => {
                                                            // Optimistic update locally or full refresh? 
                                                            // Ideally use transition, but for now simple refresh/alert
                                                            const { toggleLoanPayment } = await import('../actions');
                                                            const res = await toggleLoanPayment(loan.id, monthKey, !isPaid);
                                                            if (res.success) {
                                                                router.refresh();
                                                            }
                                                        }}
                                                        className={`text-[10px] uppercase tracking-wide font-bold px-3 py-1.5 rounded-md transition-all shadow-sm ${isPaid
                                                            ? 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-100'
                                                            : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                                                            }`}
                                                    >
                                                        {isPaid ? 'Paid ✓' : 'Pay'}
                                                    </button>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            {loans.length === 0 && (
                                <tr>
                                    <td colSpan={months.length + 2} className="px-6 py-16 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">📊</div>
                                            <p className="font-medium">No loans tracked yet.</p>
                                            <button onClick={() => setIsModalOpen(true)} className="text-blue-600 text-sm hover:underline">Add your first loan</button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddLoanModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}

function AddLoanModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Add New Loan</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                </div>

                <form action={async (formData) => {
                    const res = await addLoan(formData);
                    if (res.success) {
                        router.refresh();
                        onClose();
                    } else {
                        alert(res.message);
                    }
                }} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loan Name</label>
                        <input name="name" type="text" required placeholder="e.g. Car Loan" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Payable</label>
                            <input name="totalPayable" type="number" required placeholder="500000" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly EMI</label>
                            <input name="emiAmount" type="number" required placeholder="12000" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Day)</label>
                            <select name="dueDate" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                    <option key={d} value={d}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Month</label>
                            <input name="startDate" type="month" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Save Loan</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
