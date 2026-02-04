'use client';

import React, { useState } from 'react';
import styles from './LoanDetails.module.css';
import AddLoanModal from './AddLoanModal';
import EditPaymentModal from './EditPaymentModal';
import { deleteLoan, toggleLoanPayment, updateLoanPayment, deleteLoanPayment } from '../actions';
import { useRouter } from 'next/navigation';
import DeleteConfirmModal from './DeleteConfirmModal';
import InternalPageHeader from './InternalPageHeader';
import { Edit2, Trash2, CheckCircle, PieChart, TrendingUp, Calendar } from 'lucide-react';

export default function LoanDetails({ loan }) {
    const router = useRouter();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
    const [paymentToEdit, setPaymentToEdit] = useState(null);

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
                router.refresh();
            }
        } catch (error) {
            console.error('Toggle Payment Error:', error);
        }
    };

    const handleDeletePayment = async (monthYear) => {
        if (!confirm('Are you sure you want to delete this payment record? This will mark it as pending.')) return;
        try {
            const res = await deleteLoanPayment(loan.id, monthYear);
            if (res.success) {
                router.refresh();
            }
        } catch (error) {
            console.error('Delete Payment Error:', error);
        }
    };

    const handleEditPayment = async (oldDate, newData) => {
        try {
            const res = await updateLoanPayment(loan.id, oldDate, {
                amount: newData.amount,
                newDate: newData.date,
                description: newData.description
            });
            if (res.success) {
                router.refresh();
            } else {
                alert(res.message);
            }
        } catch (error) {
            console.error('Edit Payment Error:', error);
        }
    };

    // Calculate Analytics & Next Due
    const schedule = loan.schedule || [];
    const payments = loan.payments || {};

    const paidEMICount = Object.keys(payments).length;
    const totalEMICount = schedule.length;

    // Find the next due EMI
    const nextDueEMI = schedule.find(p => !payments[p.date]);

    const amountPaidInEMIs = schedule.reduce((acc, p) => payments[p.date] ? acc + (parseFloat(p.amount) || 0) : acc, 0);
    const totalLoanPayback = parseFloat(loan.totalPayable) || 0;
    const progress = totalLoanPayback > 0 ? (amountPaidInEMIs / totalLoanPayback) * 100 : 0;

    const remainingAmount = Math.max(0, totalLoanPayback - amountPaidInEMIs);

    return (
        <div className={styles.container}>
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
                message={`Are you sure you want to delete "${loan.name}"? This action cannot be undone.`}
            />

            <EditPaymentModal
                isOpen={isEditPaymentModalOpen}
                onClose={() => {
                    setIsEditPaymentModalOpen(false);
                    setPaymentToEdit(null);
                }}
                onSave={(newData) => handleEditPayment(paymentToEdit.date, newData)}
                initialData={paymentToEdit}
            />

            <InternalPageHeader
                backHref="/loans"
                backLabel="Back to EMI Tracker"
                actions={(
                    <>
                        <button onClick={() => setIsEditModalOpen(true)} className={styles.actionBtn}>
                            <Edit2 size={18} />
                            Edit
                        </button>
                        <button onClick={() => setIsDeleteModalOpen(true)} className={`${styles.actionBtn} ${styles.deleteBtn}`}>
                            <Trash2 size={18} />
                        </button>
                    </>
                )}
            />

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>
                        {loan.name}
                        <span className={`${styles.statusBadge} ${loan.status === 'Closed' ? styles.statusClosed : styles.statusActive}`}>
                            {loan.status || 'Active'}
                        </span>
                    </h1>
                    <div className={styles.subtitle}>{loan.lenderName || 'Loan Detail'}</div>
                </div>

            </header>

            {/* Grid Area */}
            <div className={styles.grid}>
                {/* Main Overview Card */}
                <div className={styles.card}>
                    <div className={styles.overviewHeader}>
                        <div className={styles.sectionTitle}>
                            <Calendar size={20} />
                            Loan Overview
                        </div>
                        {nextDueEMI && (
                            <button
                                onClick={() => handleTogglePayment(nextDueEMI.date, true)}
                                className={styles.markPaidBtn}
                            >
                                <CheckCircle size={14} />
                                Pay next EMI
                            </button>
                        )}
                    </div>

                    <div className={styles.metricsRow}>
                        <div>
                            <div className={styles.metricLabel}>Total Payable</div>
                            <div className={styles.metricValue}>{formatCurrency(loan.totalPayable)}</div>
                        </div>
                        <div>
                            <div className={styles.metricLabel}>Monthly EMI</div>
                            <div className={styles.metricValue}>{formatCurrency(loan.emiAmount)}</div>
                        </div>
                        <div>
                            <div className={styles.metricLabel}>Next Payment</div>
                            <div className={styles.metricValue} style={{ fontSize: '1.25rem' }}>
                                {nextDueEMI ? (
                                    new Date(nextDueEMI.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
                                ) : 'Completed'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className={`${styles.card} ${styles.vibrantCard}`}>
                        <div className={styles.vibrantHeader}>
                            <div className={styles.vibrantLabel}>Total Paid (EMIs)</div>
                            <TrendingUp size={20} style={{ opacity: 0.8 }} />
                        </div>
                        <div className={styles.vibrantValue}>{formatCurrency(amountPaidInEMIs)}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '4px' }}>
                            {paidEMICount} of {totalEMICount} installments
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>Repayment Progress</div>
                            <PieChart size={20} style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {Math.round(progress)}%
                        </div>
                        <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden', marginTop: '12px' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Ledger Section */}
            <div className={styles.historySection}>
                <div className={styles.overviewHeader}>
                    <div className={styles.sectionTitle}>Payment Ledger</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Remaining: {formatCurrency(remainingAmount)}</div>
                </div>

                <div className={styles.tableContainer}>
                    <div className={styles.tableHeader}>
                        <div>Due Date</div>
                        <div>Amount</div>
                        <div>Actions</div>
                    </div>

                    {schedule.map((entry, idx) => {
                        const payment = payments[entry.date];
                        const isPaid = !!payment;
                        return (
                            <div key={entry.id || idx} className={styles.tableRow}>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {formatCurrency(isPaid && payment.amount ? payment.amount : entry.amount)}
                                    </div>
                                    {isPaid && payment.description && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', fontStyle: 'italic' }}>
                                            {payment.description}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.statusActionGroup}>
                                    {isPaid ? (
                                        <div className={styles.entryActions}>
                                            <button
                                                onClick={() => {
                                                    setPaymentToEdit({
                                                        date: entry.date,
                                                        amount: payment.amount || entry.amount,
                                                        description: payment.description || ''
                                                    });
                                                    setIsEditPaymentModalOpen(true);
                                                }}
                                                className={styles.entryActionBtn}
                                                title="Edit Payment"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePayment(entry.date)}
                                                className={`${styles.entryActionBtn} ${styles.entryDeleteBtn}`}
                                                title="Delete Payment"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleTogglePayment(entry.date, true)}
                                            className={styles.miniPayBtn}
                                        >
                                            Pay
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
