'use client';

import React, { useState } from 'react';
import styles from './KeeshaDashboard.module.css'; // Reusing some base styles
import AddLoanModal from './AddLoanModal';
import { deleteLoan, toggleLoanPayment } from '../actions';
import { useRouter } from 'next/navigation';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function LoanDetails({ loan }) {
    const router = useRouter();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await deleteLoan(loan.id);
            if (res.success) {
                router.push('/loans');
            } else {
                alert(res.message);
                setIsDeleting(false);
                setIsDeleteModalOpen(false);
            }
        } catch (error) {
            console.error('Delete Error:', error);
            alert('Failed to delete loan.');
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    const handleTogglePayment = async (monthYear, isPaid) => {
        try {
            const res = await toggleLoanPayment(loan.id, monthYear, isPaid);
            if (res.success) {
                // Next.js will revalidate the page via actions
            }
        } catch (error) {
            console.error('Toggle Payment Error:', error);
        }
    };

    // Calculate Analytics & Next Due
    const schedule = loan.schedule || [];
    const payments = loan.payments || {};

    const paidEMICount = Object.keys(payments).length;
    const totalEMICount = schedule.length;

    // Find the actual next due EMI (first one that isn't paid)
    const nextDueEMI = schedule.find(p => !payments[p.date]);

    const downpayment = parseFloat(loan.downpaymentAmount) || 0;
    const upfrontCost = (parseFloat(loan.processingFee) || 0) + (parseFloat(loan.gstAmount) || 0);

    const amountPaidInEMIs = schedule.reduce((acc, p) => payments[p.date] ? acc + (parseFloat(p.amount) || 0) : acc, 0);
    const totalLoanPayback = parseFloat(loan.totalPayable) || 0;
    const progress = totalLoanPayback > 0 ? (amountPaidInEMIs / totalLoanPayback) * 100 : 0;

    const remainingAmount = Math.max(0, totalLoanPayback - amountPaidInEMIs);

    return (
        <div style={{ padding: '1rem 2rem 2rem 2rem' }}>
            <AddLoanModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialData={loan}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Loan"
                message={`Are you sure you want to delete "${loan.name}"? This action cannot be undone and you will lose all tracking history.`}
            />

            {/* Header: Back & Actions */}
            <header style={{
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <a href="/loans" style={{
                    color: '#6b7280',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Back to EMI Tracker
                </a>

                {/* Right-aligned Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        title="Edit Loan"
                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>

                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        disabled={isDeleting}
                        title="Delete Loan"
                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fff1f2', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </header>

            {/* Hero Card */}
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '2rem',
                position: 'relative',
                border: '1px solid var(--border)'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    padding: '4px 12px',
                    borderRadius: '50px',
                    background: '#f7f7f7',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: (loan.status || 'Active') === 'Active' ? 'var(--success)' : 'var(--danger)'
                }}>
                    {loan.status || 'ACTIVE'}
                </div>

                <h1 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#222222', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
                    {loan.name}
                </h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Total Payable</span>
                        <span style={{ fontWeight: 700, color: '#111827', fontSize: '1.5rem' }}>{formatCurrency(loan.totalPayable)}</span>
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Monthly EMI</span>
                        <span style={{ fontWeight: 700, color: '#111827', fontSize: '1.5rem' }}>{formatCurrency(loan.emiAmount)}</span>
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Next Due</span>
                        <span style={{ fontWeight: 600, color: '#6b7280', fontSize: '1.25rem' }}>
                            {nextDueEMI ? (
                                new Date(nextDueEMI.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                            ) : 'Completed'}
                        </span>
                    </div>

                    {/* Pay Button aligned to bottom right */}
                    {nextDueEMI && (
                        <div style={{ marginLeft: 'auto' }}>
                            <button
                                onClick={() => handleTogglePayment(nextDueEMI.date, true)}
                                style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 18px',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 6px -1px var(--primary-light)',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    marginBottom: '-2px' // Visual nudge to align with text baseline
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px var(--primary-light)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px var(--primary-light)';
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Pay next EMI
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Insights / Analytics */}
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#111827' }}>Analytics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>Repayment Progress</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>{Math.round(progress)}%</div>
                    <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', borderRadius: '10px', transition: 'width 0.5s ease' }}></div>
                    </div>
                </div>

                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>Total Paid (EMIs)</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{formatCurrency(amountPaidInEMIs)}</div>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{paidEMICount} of {totalEMICount} installments</span>
                </div>

                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>Remaining Balance</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>{formatCurrency(remainingAmount)}</div>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Excluding future interest savings</span>
                </div>
            </div>

            {/* Payment Ledger */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Payment Ledger</h2>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '60px' }}>#</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Due Date</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedule.map((entry, idx) => {
                            const isPaid = !!payments[entry.date];
                            return (
                                <tr key={entry.id || idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>{idx + 1}</td>
                                    <td style={{ padding: '1rem', color: '#1e293b', fontWeight: 500 }}>
                                        {new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}
                                    </td>
                                    <td style={{ padding: '1rem', color: '#1e293b', fontWeight: 600 }}>{formatCurrency(entry.amount)}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '50px',
                                                border: 'none',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                background: isPaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: isPaid ? '#10b981' : '#ef4444',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPaid ? '#10b981' : '#ef4444' }}></span>
                                            {isPaid ? 'PAID' : 'PENDING'}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
