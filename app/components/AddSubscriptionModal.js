
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { addSubscription, updateSubscription } from '../actions'
import styles from './AddSubscriptionModal.module.css'

export default function AddSubscriptionModal({ isOpen, onClose, initialData = null, existingNames = [], style }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [nameError, setNameError] = useState('');
    const [subName, setSubName] = useState(initialData?.name || '');

    // New State Logic
    const [isFreeTrial, setIsFreeTrial] = useState(false);
    const [trialDuration, setTrialDuration] = useState(1);
    const [trialUnit, setTrialUnit] = useState('Months'); // Days, Months, Years

    // History Backfill State
    const [showHistoryStep, setShowHistoryStep] = useState(false);
    const [potentialHistory, setPotentialHistory] = useState([]);
    const [selectedHistory, setSelectedHistory] = useState(new Set());
    const [pendingFormData, setPendingFormData] = useState(null);

    // Reset or Initialize state when modal opens/closes or initialData changes
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            // Reset all states when opening
            setShowHistoryStep(false);
            setPotentialHistory([]);
            setSelectedHistory(new Set());
            setPendingFormData(null);
            setNameError('');

            if (initialData) {
                // Edit Mode
                setIsFreeTrial(false);
                setSubName(initialData.name || '');
            } else {
                // Add Mode Defaults
                setIsFreeTrial(false);
                setTrialDuration(1);
                setTrialUnit('Months');
                setSubName('');
            }
        }
    }, [initialData, isOpen]);

    const isEditMode = !!initialData;
    const today = new Date().toISOString().split('T')[0];

    const calculatePotentialHistory = (startDateVal, cycle, trialLen, trialUnitVal) => {
        const start = new Date(startDateVal);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let cursor = new Date(start);

        // If trial, skip trial period
        if (isFreeTrial) {
            if (trialUnitVal === 'Days') cursor.setDate(cursor.getDate() + parseInt(trialLen));
            if (trialUnitVal === 'Months') cursor.setMonth(cursor.getMonth() + parseInt(trialLen));
            if (trialUnitVal === 'Years') cursor.setFullYear(cursor.getFullYear() + parseInt(trialLen));
        }

        const dates = [];
        while (cursor < today) {
            dates.push(new Date(cursor));

            // Advance
            if (cycle === 'Monthly') cursor.setMonth(cursor.getMonth() + 1);
            if (cycle === 'Yearly') cursor.setFullYear(cursor.getFullYear() + 1);
            if (cycle === 'Quarterly') cursor.setMonth(cursor.getMonth() + 3);
        }
        return dates;
    };

    const handleInitialSubmit = (formData) => {
        // Uniqueness check
        const nameVal = formData.get('name').trim();
        if (!isEditMode && existingNames.some(name => name.toLowerCase() === nameVal.toLowerCase())) {
            setNameError(`A subscription with the name "${nameVal}" already exists.`);
            return;
        }

        // Check for history
        if (!isEditMode) {
            const sDate = formData.get('startDate');
            const cycle = formData.get('billingCycle');

            // Check if we need history
            const dates = calculatePotentialHistory(sDate, cycle, trialDuration, trialUnit);
            if (dates.length > 1) {
                setPotentialHistory(dates);
                // Default select all
                setSelectedHistory(new Set(dates.map(d => d.toISOString())));
                setPendingFormData(formData);
                setShowHistoryStep(true);
                return;
            } else if (dates.length === 1) {
                // If only 1 payment, skip verification and add it automatically or let legacy handle it
                // To be safe and explicit, we pass it as history
                proceedWithSubmit(formData, dates.map(d => d.toISOString()));
                return;
            }
        }

        // No history needed, proceed normally
        proceedWithSubmit(formData);
    };

    const proceedWithSubmit = async (formData, historyToSubmit = null) => {
        setIsSubmitting(true)

        let result;
        if (isEditMode) {
            result = await updateSubscription(initialData.id, formData);
        } else {
            formData.append('isFreeTrial', isFreeTrial);
            if (isFreeTrial) {
                formData.append('trialDuration', trialDuration);
                formData.append('trialUnit', trialUnit);
            }

            if (historyToSubmit) {
                formData.append('history', JSON.stringify(historyToSubmit));
            }

            result = await addSubscription(formData);
        }

        setIsSubmitting(false)
        if (result.success) {
            onClose()
            if (isEditMode) router.refresh();
        } else {
            alert(result.message)
        }
    };

    const toggleHistoryDate = (isoDate) => {
        const newSet = new Set(selectedHistory);
        if (newSet.has(isoDate)) newSet.delete(isoDate);
        else newSet.add(isoDate);
        setSelectedHistory(newSet);
    };

    if (!isOpen) return null;

    // Check if mounted for Portal
    if (!mounted || typeof document === 'undefined') return null;

    const modalContent = showHistoryStep ? (
        <div className={styles.overlay} onClick={onClose} style={{ zIndex: 9999, ...style }}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Verify Past Payments</h2>
                </div>
                {/* ... existing history step content ... */}
                <div style={{ padding: '1.5rem' }}>
                    <p style={{ marginBottom: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: '1.4' }}>
                        This subscription started in the past. We found {potentialHistory.length} potential payment dates.
                        Uncheck any you missed.
                    </p>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--background)' }}>
                        {potentialHistory.map((date, idx) => {
                            const iso = date.toISOString();
                            return (
                                <div key={idx} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--surface)' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedHistory.has(iso)}
                                        onChange={() => toggleHistoryDate(iso)}
                                        style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
                                    />
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                                        {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    <div className={styles.actions} style={{ marginTop: '1.75rem' }}>
                        <button onClick={() => proceedWithSubmit(pendingFormData, [])} className={styles.cancelBtn}>Skip History</button>
                        <button
                            onClick={() => proceedWithSubmit(pendingFormData, Array.from(selectedHistory).sort())}
                            className={styles.submitBtn}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : `Confirm & Add (${selectedHistory.size})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    ) : (
        <div className={styles.overlay} onClick={onClose} style={{ zIndex: 9999, ...style }}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{isEditMode ? 'Edit Subscription' : 'Add New Subscription'}</h2>
                </div>

                <form
                    key={`${isOpen}-${initialData?.id || 'new'}`}
                    action={handleInitialSubmit}
                    className={styles.form}
                >
                    <div className={styles.formGroup}>
                        <label>Platform Name</label>
                        <input
                            name="name"
                            type="text"
                            required
                            placeholder="e.g. Netflix"
                            value={subName}
                            onChange={(e) => {
                                setSubName(e.target.value);
                                setNameError('');
                            }}
                        />
                        {nameError && <span className={styles.errorMessage}>{nameError}</span>}
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Category</label>
                            <select name="category" defaultValue={initialData?.category || "Entertainment"}>
                                <option value="Utilities">Utilities</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="Lifestyle">Lifestyle</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Billing Cycle</label>
                            <select name="billingCycle" defaultValue={initialData?.billingCycle || "Monthly"}>
                                <option value="Monthly">Monthly</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Yearly">Yearly</option>
                            </select>
                        </div>
                    </div>

                    {/* Dates Row */}
                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Start Date</label>
                            <input
                                name="startDate"
                                type="date"
                                required
                                defaultValue={initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : today}
                            />
                        </div>

                        {isEditMode && (
                            <div className={styles.formGroup}>
                                <label>Next Renewal</label>
                                <input
                                    name="nextRenewalDate"
                                    type="date"
                                    required
                                    defaultValue={initialData?.nextRenewalDate ? new Date(initialData.nextRenewalDate).toISOString().split('T')[0] : ''}
                                />
                            </div>
                        )}
                    </div>

                    {/* Free Trial Toggle - Only in Add Mode */}
                    {!isEditMode && (
                        <div className={styles.checkboxGroup}>
                            <input
                                type="checkbox"
                                id="isFreeTrial"
                                checked={isFreeTrial}
                                onChange={(e) => setIsFreeTrial(e.target.checked)}
                            />
                            <label htmlFor="isFreeTrial" style={{ fontWeight: 600 }}>Does this subscription have a free trial?</label>
                        </div>
                    )}

                    {/* Conditional Trial Duration Inputs */}
                    {isFreeTrial && !isEditMode && (
                        <div className={styles.row} style={{ background: '#f7f7f7', padding: '1rem', borderRadius: '8px' }}>
                            <div className={styles.formGroup}>
                                <label>Trial Duration</label>
                                <input
                                    type="number"
                                    value={trialDuration}
                                    onChange={(e) => setTrialDuration(e.target.value)}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Unit</label>
                                <select value={trialUnit} onChange={(e) => setTrialUnit(e.target.value)}>
                                    <option value="Days">Days</option>
                                    <option value="Months">Months</option>
                                    <option value="Years">Years</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>{isFreeTrial ? 'Cost After Trial' : 'Regular Cost'}</label>
                            <input
                                name="currentCost"
                                type="number"
                                step="0.01"
                                required
                                placeholder="0.00"
                                defaultValue={initialData?.currentCost || ''}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Payment Method</label>
                            <input
                                name="paymentMethod"
                                type="text"
                                placeholder="e.g. Credit Card"
                                defaultValue={initialData?.paymentMethod || ''}
                            />
                        </div>
                    </div>

                    <div className={styles.checkboxGroup} style={{ marginTop: 0 }}>
                        <input
                            name="autoPayActive"
                            type="checkbox"
                            id="autopay"
                            defaultChecked={initialData ? initialData.autoPayActive : true}
                        />
                        <label htmlFor="autopay">Auto-Pay Enabled</label>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                            {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Subscription' : 'Add Subscription')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
