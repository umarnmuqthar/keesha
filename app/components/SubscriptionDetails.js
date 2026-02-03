'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    calculateDaysUntilDue,
    calculateAmortizedMonthlyCost,
    calculateProjectedYearlyCost
} from '@/lib/keesha-logic';
import styles from './SubscriptionDetails.module.css';
import AddSubscriptionModal from './AddSubscriptionModal';

import { updateSubscriptionStatus, recordPayment, deleteSubscription, addManualPayment, deletePaymentEntry, updatePaymentEntry, addBulkPayments } from '../actions';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function SubscriptionDetails({ subscription }) {
    const router = useRouter();
    // Manual Payment State
    const [manualPaymentModal, setManualPaymentModal] = React.useState({
        isOpen: false,
        mode: 'add', // 'add' | 'edit'
        type: 'single', // 'single' | 'bulk'
        ledgerId: null,
        date: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        amount: subscription.currentCost
    });

    const calculateBulkDates = () => {
        if (manualPaymentModal.type !== 'bulk') return [];
        const start = new Date(manualPaymentModal.date); // Start Date
        const end = new Date(manualPaymentModal.endDate);
        const dates = [];
        let current = new Date(start);

        // Sanity check to prevent infinite loops if dates are weird
        if (start > end) return [];

        let count = 0;
        while (current <= end && count < 50) { // Limit to 50 to be safe
            dates.push(new Date(current).toISOString());

            if (subscription.billingCycle === 'Monthly') {
                current.setMonth(current.getMonth() + 1);
            } else if (subscription.billingCycle === 'Yearly') {
                current.setFullYear(current.getFullYear() + 1);
            } else if (subscription.billingCycle === 'Quarterly') {
                current.setMonth(current.getMonth() + 3);
            } else {
                current.setMonth(current.getMonth() + 1);
            }
            count++;
        }
        return dates;
    };

    const handleManualPaymentSubmit = async () => {
        try {
            let result;
            if (manualPaymentModal.mode === 'edit') {
                result = await updatePaymentEntry(subscription.id, manualPaymentModal.ledgerId, manualPaymentModal.amount, manualPaymentModal.date);
            } else {
                if (manualPaymentModal.type === 'bulk') {
                    const dates = calculateBulkDates();
                    if (dates.length === 0) {
                        alert('No valid dates in range');
                        return;
                    }
                    result = await addBulkPayments(subscription.id, manualPaymentModal.amount, dates);
                } else {
                    result = await addManualPayment(subscription.id, manualPaymentModal.amount, manualPaymentModal.date);
                }
            }

            if (result.success) {
                router.refresh();
            } else {
                alert('Failed to save payment');
            }
        } catch (e) {
            console.error(e);
        }
        setManualPaymentModal(prev => ({ ...prev, isOpen: false }));
    };

    const formatCurrency = (amount) => {
        const hasDecimals = amount % 1 !== 0;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: hasDecimals ? 2 : 0,
            maximumFractionDigits: hasDecimals ? 2 : 0
        }).format(amount);
    };

    const daysUntilDue = calculateDaysUntilDue(subscription.nextRenewalDate);
    const amortizedCost = calculateAmortizedMonthlyCost(subscription.currentCost, subscription.billingCycle);
    const yearlyCost = calculateProjectedYearlyCost(subscription.currentCost, subscription.billingCycle);

    const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
    const [showStatusModal, setShowStatusModal] = React.useState(false);
    const [newStatus, setNewStatus] = React.useState('');
    const [effectiveDate, setEffectiveDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [confirmModal, setConfirmModal] = React.useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        confirmText: 'Confirm',
        confirmColor: 'var(--primary)',
        dangerous: false
    });

    const [deleteModal, setDeleteModal] = React.useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

    const handleStatusChange = async () => {
        setIsUpdatingStatus(true);
        try {
            const result = await updateSubscriptionStatus(subscription.id, newStatus, effectiveDate);

            if (result.success) {
                router.refresh();
            } else {
                alert('Failed to update: ' + (result.message || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('System error updating status');
        } finally {
            setIsUpdatingStatus(false);
            setShowStatusModal(false);
        }
    };

    const handlePayment = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Mark as Paid',
            message: `Record a payment of ${formatCurrency(subscription.currentCost)} for today? This will update the Next Renewal date.`,
            confirmText: 'Mark Paid',
            confirmColor: 'var(--primary)',
            onConfirm: async () => {
                try {
                    const result = await recordPayment(subscription.id, subscription.currentCost, new Date());
                    if (result.success) router.refresh();
                    else alert('Failed to record payment');
                } catch (err) { console.error(err); }
                closeConfirmModal();
            }
        });
    }

    const handleDelete = () => {
        setDeleteModal({
            isOpen: true,
            title: 'Delete Subscription',
            message: `Are you sure you want to delete "${subscription.name}"? This action cannot be undone and you will lose all payment history.`,
            onConfirm: async () => {
                try {
                    const result = await deleteSubscription(subscription.id);
                    if (result.success) router.push('/subscriptions');
                    else alert('Failed to delete');
                } catch (err) { console.error(err); }
                setDeleteModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const openStatusModal = (status) => {
        setNewStatus(status);
        if (status === 'Cancelled') {
            if (subscription.nextRenewalDate) {
                setEffectiveDate(new Date(subscription.nextRenewalDate).toISOString().split('T')[0]);
            } else {
                setEffectiveDate(new Date().toISOString().split('T')[0]);
            }
        } else {
            setEffectiveDate(new Date().toISOString().split('T')[0]);
        }
        setShowStatusModal(true);
    };

    const ledgerHistory = [...subscription.ledger].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lifetimeSpend = ledgerHistory.reduce((acc, curr) => acc + curr.amount, 0);

    const earliestLedgerDate = ledgerHistory.length > 0
        ? ledgerHistory[ledgerHistory.length - 1].date
        : null;

    const modalInitialData = {
        ...subscription,
        startDate: subscription.startDate || earliestLedgerDate || subscription.createdAt
    };

    return (
        <div className={styles.container}>
            <AddSubscriptionModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialData={modalInitialData}
            />

            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={deleteModal.onConfirm}
                title={deleteModal.title}
                message={deleteModal.message}
            />

            {showStatusModal && (
                <DeleteConfirmModal
                    isOpen={showStatusModal}
                    onClose={() => setShowStatusModal(false)}
                    onConfirm={handleStatusChange}
                    title={newStatus === 'Cancelled' ? 'Cancel Subscription' : 'Resume Subscription'}
                    confirmText={newStatus === 'Cancelled' ? 'Cancel Subscription' : 'Resume Subscription'}
                    confirmColor={newStatus === 'Cancelled' ? 'var(--danger)' : 'var(--primary)'}
                    titleColor={newStatus === 'Cancelled' ? 'var(--danger)' : 'var(--text-primary)'}
                    disabled={isUpdatingStatus}
                >
                    {newStatus === 'Active' && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                Reactivation Date
                            </label>
                            <input
                                type="date"
                                value={effectiveDate}
                                onChange={(e) => setEffectiveDate(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)',
                                    border: '1px solid var(--border)', fontSize: '0.9375rem'
                                }}
                            />
                        </div>
                    )}
                    {newStatus === 'Cancelled' && (
                        <>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5', margin: '0 0 1.5rem 0' }}>
                                Are you sure you want to cancel this subscription?
                            </p>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                    Cancellation Date
                                </label>
                                <input
                                    type="date"
                                    value={effectiveDate}
                                    onChange={(e) => setEffectiveDate(e.target.value)}
                                    style={{
                                        width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border)', fontSize: '0.9375rem'
                                    }}
                                />
                            </div>
                        </>
                    )}
                </DeleteConfirmModal>
            )}

            {confirmModal.isOpen && (
                <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '20vh', zIndex: 110,
                    borderRadius: 'var(--radius)'
                }} onClick={closeConfirmModal}>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius)', width: '90%', maxWidth: '380px', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: confirmModal.dangerous ? 'var(--danger)' : 'var(--text-primary)' }}>{confirmModal.title}</h3>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>{confirmModal.message}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={closeConfirmModal} style={{ background: 'white', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 'var(--radius)', fontWeight: 500, fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={confirmModal.onConfirm} style={{
                                background: confirmModal.dangerous ? 'var(--danger)' : (confirmModal.confirmColor || 'var(--primary)'),
                                color: 'white', border: 'none', padding: '4px 10px', borderRadius: 'var(--radius)', fontWeight: 500, fontSize: '0.8125rem', cursor: 'pointer'
                            }}>
                                {confirmModal.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <a href="/subscriptions" className={styles.backLink}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Back to Subscriptions
            </a>

            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.titleSection}>
                        <h1>
                            {subscription.name}
                            <span className={`${styles.statusBadge} ${subscription.status === 'Cancelled' ? styles.statusCancelled : styles.statusActive}`}>
                                {subscription.status}
                            </span>
                        </h1>
                        <div className={styles.subtitle}>{subscription.category || 'Subscription'}</div>
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <button onClick={() => setIsEditModalOpen(true)} className={styles.actionBtn}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>

                    {subscription.status === 'Active' ? (
                        <button onClick={() => openStatusModal('Cancelled')} className={`${styles.actionBtn} ${styles.deleteBtn}`} style={{ color: 'var(--danger)', borderColor: '#fee2e2' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                            Cancel
                        </button>
                    ) : (
                        <button onClick={() => openStatusModal('Active')} className={styles.actionBtn}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            Resume
                        </button>
                    )}

                    <button onClick={handleDelete} className={`${styles.actionBtn} ${styles.deleteBtn}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </header>

            <div className={styles.grid}>
                {/* Main Column */}
                <div>
                    {/* Subscription Overview Card */}
                    <div className={styles.card} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div className={styles.overviewHeader}>
                            <div className={styles.sectionTitle}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                Subscription Overview
                            </div>
                            {subscription.status === 'Active' && daysUntilDue <= 0 && (
                                <button onClick={handlePayment} className={styles.markPaidBtn}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    Mark as Paid
                                </button>
                            )}
                        </div>

                        <div className={styles.metricsRow}>
                            <div>
                                <div className={styles.metricLabel}>Monthly Cost</div>
                                <div className={styles.metricValue}>{formatCurrency(amortizedCost)}</div>
                            </div>
                            <div>
                                <div className={styles.metricLabel}>Billing Cycle</div>
                                <div className={styles.metricValue} style={{ fontSize: '1.25rem' }}>{subscription.billingCycle}</div>
                            </div>
                            <div>
                                <div className={styles.metricLabel}>Next Payment</div>
                                <div className={styles.metricValue} style={{ fontSize: '1.25rem' }}>
                                    {subscription.nextRenewalDate
                                        ? new Date(subscription.nextRenewalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
                                        : 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className={styles.paymentMethodRow} style={{ marginTop: 'auto' }}>
                            <div className={styles.methodInfo}>
                                <div className={styles.methodIcon}>
                                    {subscription.paymentMethod === 'UPI' ? (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                                    ) : (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {subscription.paymentMethod || 'Card'}
                                    </div>
                                </div>
                            </div>
                            {/* Update Method Button Removed */}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Yearly Spending Card */}
                    <div className={`${styles.card} ${styles.yearlyCard}`}>
                        <div className={styles.yearlyHeader}>
                            <div className={styles.yearlyLabel}>Yearly Spending</div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
                        </div>
                        <div className={styles.yearlyAmount}>{formatCurrency(yearlyCost)}</div>
                    </div>

                    {/* Lifetime Total Card */}
                    <div className={`${styles.card} ${styles.lifetimeCard}`}>
                        <div className={styles.lifetimeHeader}>
                            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', fontWeight: 600 }}>Lifetime Total</div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                            {formatCurrency(lifetimeSpend)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment History Section - Moved Outside Grid for Full Width */}
            <div className={styles.historySection}>
                <div className={styles.historyHeader}>
                    <div className={styles.sectionTitle}>Payment History</div>
                    <button
                        onClick={() => setManualPaymentModal({
                            isOpen: true,
                            mode: 'add',
                            type: 'single',
                            date: new Date().toISOString().split('T')[0],
                            endDate: new Date().toISOString().slice(0, 7),
                            amount: subscription.currentCost
                        })}
                        className={styles.logPaymentBtn}
                    >
                        + Log Payment
                    </button>
                </div>

                <div className={styles.tableContainer}>
                    <div className={styles.tableHeader}>
                        <div>Date</div>
                        <div>Amount</div>
                        <div>Status</div>
                        <div>Description</div>
                        <div style={{ textAlign: 'right' }}>Actions</div>
                    </div>

                    {ledgerHistory.length > 0 ? (
                        ledgerHistory.map((tx) => (
                            <div key={tx.id} className={styles.tableRow}>
                                <div className={styles.dateCell}>
                                    <span className={styles.dayText}>{new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>

                                </div>
                                <div className={styles.amountCell}>{formatCurrency(tx.amount)}</div>
                                <div>
                                    <span className={styles.statusCellBadge} style={{ background: '#dcfce7', color: '#166534' }}>Paid</span>
                                </div>
                                <div className={styles.descCell}>{tx.type || 'Manual Entry'}</div>
                                <div className={styles.actionsCell}>
                                    <button
                                        onClick={() => setManualPaymentModal({
                                            isOpen: true,
                                            mode: 'edit',
                                            ledgerId: tx.id,
                                            date: new Date(tx.date).toISOString().split('T')[0],
                                            amount: tx.amount
                                        })}
                                        className={styles.iconBtn}
                                        title="Edit"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setDeleteModal({
                                                isOpen: true,
                                                title: 'Delete Entry',
                                                message: `Delete payment of ${formatCurrency(tx.amount)} from ${new Date(tx.date).toLocaleDateString()}?`,
                                                onConfirm: async () => {
                                                    await deletePaymentEntry(subscription.id, tx.id);
                                                    setDeleteModal(prev => ({ ...prev, isOpen: false }));
                                                    router.refresh();
                                                }
                                            });
                                        }}
                                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                        style={{ color: 'var(--text-tertiary)' /* Override danger by default, hover handles it */ }}
                                        title="Delete"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path></svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', gridColumn: '1 / -1' }}>
                            No payment history found.
                        </div>
                    )}
                </div>
            </div>

            {/* Manual Payment Modal Overlay */}
            {manualPaymentModal.isOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                }} onClick={() => setManualPaymentModal({ ...manualPaymentModal, isOpen: false })}>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius)', width: '380px', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                            {manualPaymentModal.mode === 'edit' ? 'Edit Payment' : 'Add Payment'}
                        </h3>

                        <div style={{ marginBottom: '1rem' }}>
                            {manualPaymentModal.mode === 'add' && (
                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                                    <button
                                        onClick={() => setManualPaymentModal({ ...manualPaymentModal, type: 'single' })}
                                        style={{
                                            padding: '4px 8px',
                                            borderBottomStyle: 'solid',
                                            borderBottomWidth: '2px',
                                            borderBottomColor: manualPaymentModal.type === 'single' ? 'var(--primary)' : 'transparent',
                                            color: manualPaymentModal.type === 'single' ? 'var(--primary)' : 'var(--text-tertiary)',
                                            fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        Single
                                    </button>
                                    <button
                                        onClick={() => setManualPaymentModal({ ...manualPaymentModal, type: 'bulk' })}
                                        style={{
                                            padding: '4px 8px',
                                            borderBottomStyle: 'solid',
                                            borderBottomWidth: '2px',
                                            borderBottomColor: manualPaymentModal.type === 'bulk' ? 'var(--primary)' : 'transparent',
                                            color: manualPaymentModal.type === 'bulk' ? 'var(--primary)' : 'var(--text-tertiary)',
                                            fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        Bulk
                                    </button>
                                </div>
                            )}

                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                {manualPaymentModal.type === 'bulk' ? 'Start Date' : 'Date'}
                            </label>
                            <input
                                type="date"
                                value={manualPaymentModal.date}
                                onChange={(e) => setManualPaymentModal({ ...manualPaymentModal, date: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                            />
                        </div>

                        {manualPaymentModal.type === 'bulk' && manualPaymentModal.mode === 'add' && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>End Month</label>
                                <input
                                    type="month"
                                    value={manualPaymentModal.endDate}
                                    onChange={(e) => setManualPaymentModal({ ...manualPaymentModal, endDate: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                                />
                                <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-tertiary)', background: 'var(--sidebar-bg)', padding: '0.5rem', borderRadius: '4px' }}>
                                    Generates {calculateBulkDates().length} transactions ({subscription.billingCycle})
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Amount</label>
                            <input
                                type="number"
                                value={manualPaymentModal.amount}
                                onChange={(e) => setManualPaymentModal({ ...manualPaymentModal, amount: parseFloat(e.target.value) })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setManualPaymentModal({ ...manualPaymentModal, isOpen: false })}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleManualPaymentSubmit}
                                style={{
                                    background: 'var(--primary)', color: 'white', border: 'none',
                                    padding: '6px 12px', borderRadius: 'var(--radius)', fontWeight: 500,
                                    cursor: 'pointer', fontSize: '0.8125rem'
                                }}
                            >
                                {manualPaymentModal.mode === 'edit' ? 'Save' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
