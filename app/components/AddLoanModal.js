'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import styles from './AddLoanModal.module.css';
import { addLoan, updateLoan } from '../actions';
import { generatePaymentSchedule, calculateEffectiveInterestRate, getLoanAdvice, formatScheduleDate } from '@/lib/loan-utils';

export default function AddLoanModal({ isOpen, onClose, initialData = null, existingNames = [] }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nameError, setNameError] = useState('');
    const [formData, setFormData] = useState({
        loanType: initialData?.loanType || 'Personal',
        productAmount: initialData?.productAmount || '',
        loanAmount: initialData?.loanAmount || '',
        creditedAmount: initialData?.creditedAmount || '',
        emiAmount: initialData?.emiAmount || '',
        tenure: initialData?.tenure || '',
        dueDate: initialData?.dueDate || 1,
        startDate: initialData?.startDate || '',
        firstEmiDate: initialData?.startDate && initialData?.dueDate
            ? `${initialData.startDate}-${String(initialData.dueDate).padStart(2, '0')}`
            : '',
        hasDownpayment: initialData?.hasDownpayment || false,
        downpaymentAmount: initialData?.downpaymentAmount || '',
        processingFee: initialData?.processingFee || '',
        otherCharges: initialData?.otherCharges || '',
        interestRate: initialData?.interestRate || '',
        schedule: initialData?.schedule || []
    });

    const isEditMode = !!initialData;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const defaultFormData = {
        name: '',
        loanType: 'Personal',
        productAmount: '',
        loanAmount: '',
        creditedAmount: '',
        emiAmount: '',
        tenure: '',
        dueDate: 1,
        startDate: '',
        firstEmiDate: '',
        hasDownpayment: false,
        downpaymentAmount: '',
        processingFee: '',
        otherCharges: '',
        interestRate: '',
        schedule: []
    };

    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                setFormData({
                    ...initialData,
                    loanType: initialData.loanType || 'Personal',
                    productAmount: initialData.productAmount || '',
                    loanAmount: initialData.loanAmount || '',
                    creditedAmount: initialData.creditedAmount || '',
                    interestRate: initialData.interestRate || '',
                    firstEmiDate: initialData.startDate && initialData.dueDate
                        ? `${initialData.startDate}-${String(initialData.dueDate).padStart(2, '0')}`
                        : ''
                });
            } else {
                setFormData(defaultFormData);
                setStep(1);
            }
        }
    }, [isOpen, isEditMode, initialData]);

    const totalPayable = useMemo(() => {
        // If we are on Step 1, typically we want to see the planned total based on EMI * Tenure
        // On Step 2 and 3, we want to see the actual total from the potentially modified schedule
        if (step > 1 && formData.schedule && formData.schedule.length > 0) {
            return formData.schedule.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        }
        return (parseFloat(formData.emiAmount) || 0) * (parseInt(formData.tenure) || 0);
    }, [formData.emiAmount, formData.tenure, formData.schedule, step]);

    const gstAmount = useMemo(() => {
        // GST is 18% of the Processing Fee (base)
        return (parseFloat(formData.processingFee) || 0) * 0.18;
    }, [formData.processingFee]);

    const totalUpfront = useMemo(() => {
        return (parseFloat(formData.processingFee) || 0) +
            gstAmount +
            (parseFloat(formData.otherCharges) || 0);
    }, [formData.processingFee, gstAmount, formData.otherCharges]);

    // Use a ref to track if the last change was manual to interest rate
    const isManualInterestRef = useRef(false);
    useEffect(() => {
        isManualInterestRef.current = false;
    }, [formData.processingFee, formData.otherCharges, formData.creditedAmount, formData.productAmount, formData.downpaymentAmount, formData.schedule]);

    useEffect(() => {
        if (!isOpen) return;

        const principalBase = formData.loanType === 'Personal'
            ? (parseFloat(formData.creditedAmount) || 0)
            : ((parseFloat(formData.productAmount) || 0) - (parseFloat(formData.downpaymentAmount) || 0));

        const netPrincipal = principalBase - totalUpfront;

        if (netPrincipal <= 0) return;

        const calculated = calculateEffectiveInterestRate(
            netPrincipal,
            formData.schedule,
            0
        );

        // Auto-update ONLY if interestRate is empty (initial load of step 3)
        // Subsequent changes to fees will be handled by this effect IF the user hasn't typed in interestRate?
        // Actually, user wants "Which ever field is adjusted change the other fields accordingly".
        // To avoid loops, we'll only auto-calculate if the change didn't come from interestRate itself.
        // We'll trust the dependency array. 
        // We only update if this effect was triggered by a fee change.
        if (formData.interestRate === '' || formData.interestRate === '0.00' || !isManualInterestRef.current) {
            setFormData(prev => ({ ...prev, interestRate: calculated }));
        }
    }, [formData.creditedAmount, formData.productAmount, formData.schedule, totalUpfront, isOpen, formData.loanType, formData.downpaymentAmount]);

    const handleUpfrontChange = (name, value) => {
        // This is now handled by standard handleChange or specific needs if any
        // But the user asked to remove "Total Upfront Cost" field, so we just use handleChange
    };

    const advice = useMemo(() => {
        return getLoanAdvice(formData.interestRate);
    }, [formData.interestRate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'interestRate') {
            isManualInterestRef.current = true;
            // Manual Interest -> Other Charges Solver
            const r = parseFloat(value) || 0;
            const years = (formData.schedule?.length || parseInt(formData.tenure) || 0) / 12;
            if (years > 0 && totalPayable > 0) {
                const principalBase = formData.loanType === 'Personal'
                    ? (parseFloat(formData.creditedAmount) || 0)
                    : ((parseFloat(formData.productAmount) || 0) - (parseFloat(formData.downpaymentAmount) || 0));

                // Formula derived from effective interest rate calculation:
                // totalPayable / (netPrincipal) = (1 + r*years)
                // netPrincipal = totalPayable / (1 + r*years)
                // netPrincipal = principalBase - totalUpfront
                // totalUpfront = principalBase - netPrincipal
                // totalUpfront = principalBase - (totalPayable / (1 + r*years))

                const requiredNetCash = totalPayable / (1 + (r / 100) * years);
                const requiredTotalUpfront = principalBase - requiredNetCash;

                const currentGst = (parseFloat(formData.processingFee) || 0) * 0.18;
                const currentBaseFee = (parseFloat(formData.processingFee) || 0);
                const newOtherCharges = requiredTotalUpfront - (currentBaseFee + currentGst);

                setFormData(prev => ({
                    ...prev,
                    interestRate: value,
                    otherCharges: Math.max(0, newOtherCharges).toFixed(2)
                }));
            } else {
                setFormData(prev => ({ ...prev, interestRate: value }));
            }
            return;
        }

        if (name === 'firstEmiDate') {
            const dateParts = value.split('-');
            if (dateParts.length === 3) {
                const year = dateParts[0];
                const month = dateParts[1];
                const day = parseInt(dateParts[2]);
                setFormData(prev => ({
                    ...prev,
                    firstEmiDate: value,
                    startDate: `${year}-${month}`,
                    dueDate: day
                }));
                return;
            }
        }
        if (name === 'name') {
            setNameError('');
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleNext = (e) => {
        if (e) e.preventDefault();
        if (step === 1) {
            // Uniqueness check
            if (!isEditMode && existingNames.some(name => name.toLowerCase() === formData.name.trim().toLowerCase())) {
                setNameError(`A loan with the name "${formData.name}" already exists.`);
                return;
            }

            // Only regenerate if structural parameters changed (Tenure, Start Date, Due Date)
            // or if the schedule is entirely missing (New mode)
            const hasStructureChanged =
                !isEditMode ||
                !formData.schedule ||
                formData.schedule.length === 0 ||
                formData.tenure != (initialData?.tenure || 0) ||
                formData.startDate !== (initialData?.startDate || '') ||
                formData.dueDate != (initialData?.dueDate || 0);

            // Also check if the default EMI amount was modified - if so, we reset to keep consistency
            const hasDefaultAmountChanged = formData.emiAmount != (initialData?.emiAmount || 0);

            if (hasStructureChanged || hasDefaultAmountChanged) {
                const newSchedule = generatePaymentSchedule(
                    formData.startDate,
                    parseInt(formData.tenure),
                    formData.emiAmount,
                    parseInt(formData.dueDate)
                );

                // If editing and structural changes occurred (like tenure extension), 
                // try to preserve custom amounts for existing dates instead of flattening everything
                if (isEditMode && hasStructureChanged && !hasDefaultAmountChanged && formData.schedule?.length > 0) {
                    const merged = newSchedule.map(ns => {
                        const existing = formData.schedule.find(os => os.date === ns.date);
                        return existing ? { ...ns, amount: existing.amount, isPaid: existing.isPaid } : ns;
                    });
                    setFormData(prev => ({ ...prev, schedule: merged }));
                } else {
                    setFormData(prev => ({ ...prev, schedule: newSchedule }));
                }
            }
            // If nothing changed, we proceed with current formData.schedule (preserving manual edits)
            setStep(2);
        } else if (step === 2) {
            setStep(3);
        }
    };

    const handleBack = () => setStep(prev => prev - 1);

    const handleScheduleChange = (index, field, value) => {
        const newSchedule = [...formData.schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setFormData(prev => ({ ...prev, schedule: newSchedule }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (step < 3) return; // Prevent submission on Enter if not on last step

        // Uniqueness check (Final check before submit)
        if (!isEditMode && existingNames.some(name => name.toLowerCase() === formData.name.trim().toLowerCase())) {
            setNameError(`A loan with the name "${formData.name}" already exists.`);
            setStep(1); // Go back to fix it
            return;
        }

        setIsSubmitting(true);

        const finalFormData = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (key === 'schedule') {
                finalFormData.append(key, JSON.stringify(value));
            } else {
                finalFormData.append(key, value);
            }
        });
        finalFormData.append('totalPayable', totalPayable);
        finalFormData.append('gstAmount', gstAmount);
        finalFormData.append('totalUpfront', totalUpfront);
        finalFormData.append('interestRate', formData.interestRate);

        try {
            const res = isEditMode
                ? await updateLoan(initialData.id, finalFormData)
                : await addLoan(finalFormData);

            if (res.success) {
                router.refresh();
                onClose();
                setStep(1);
            } else {
                alert(res.message);
            }
        } catch (error) {
            console.error('Submit Error:', error);
            alert('Something went wrong.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // React Portal logic
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen) return null;

    if (!mounted || typeof document === 'undefined') return null;

    return createPortal(
        <div className={styles.overlay} onClick={onClose} style={{ zIndex: 9999 }}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{isEditMode ? 'Edit Loan' : 'Add New Loan'}</h2>
                </div>

                <div className={styles.stepIndicator}>
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`${styles.stepDot} ${step === s ? styles.activeDot : ''}`} />
                    ))}
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    {step === 1 && (
                        <>
                            {!isEditMode ? (
                                <div className={styles.typeSelector}>
                                    <button
                                        type="button"
                                        className={`${styles.typeBtn} ${formData.loanType === 'Personal' ? styles.typeBtnActive : ''}`}
                                        onClick={() => setFormData(p => ({ ...p, loanType: 'Personal', hasDownpayment: false }))}
                                    >
                                        Personal Loan
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.typeBtn} ${formData.loanType === 'Consumer' ? styles.typeBtnActive : ''}`}
                                        onClick={() => setFormData(p => ({ ...p, loanType: 'Consumer' }))}
                                    >
                                        Consumer Loan
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.immutableTypeContainer}>
                                    <div className={styles.immutableTypeBadge}>
                                        {formData.loanType} Loan
                                    </div>
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label>Loan Name</label>
                                <input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="e.g. Home Loan" required />
                                {nameError && <span className={styles.errorMessage}>{nameError}</span>}
                            </div>

                            {formData.loanType === 'Personal' ? (
                                <>
                                    <div className={styles.row}>
                                        <div className={styles.formGroup}>
                                            <label>Loan Amount</label>
                                            <input name="loanAmount" type="number" value={formData.loanAmount} onChange={handleChange} placeholder="0" required />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Credited Amount</label>
                                            <input name="creditedAmount" type="number" value={formData.creditedAmount} onChange={handleChange} placeholder="0" required />
                                        </div>
                                    </div>

                                    <div className={styles.row}>
                                        <div className={styles.formGroup}>
                                            <label>Monthly EMI</label>
                                            <input name="emiAmount" type="number" value={formData.emiAmount} onChange={handleChange} placeholder="0" required />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Tenure (Months)</label>
                                            <input name="tenure" type="number" value={formData.tenure} onChange={handleChange} placeholder="0" required />
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>First EMI Date</label>
                                        <input name="firstEmiDate" type="date" value={formData.firstEmiDate} onChange={handleChange} required />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={styles.checkboxRow}>
                                        <input name="hasDownpayment" type="checkbox" checked={formData.hasDownpayment} onChange={handleChange} id="downpayment-check" />
                                        <label htmlFor="downpayment-check">Does this Loan has Downpayment?</label>
                                    </div>

                                    {formData.hasDownpayment && (
                                        <div className={styles.formGroup}>
                                            <label>Downpayment Amount</label>
                                            <input name="downpaymentAmount" type="number" value={formData.downpaymentAmount} onChange={handleChange} placeholder="0" />
                                        </div>
                                    )}

                                    <div className={styles.row}>
                                        <div className={styles.formGroup}>
                                            <label>Product Amount</label>
                                            <input name="productAmount" type="number" value={formData.productAmount} onChange={handleChange} placeholder="0" required />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Monthly EMI</label>
                                            <input name="emiAmount" type="number" value={formData.emiAmount} onChange={handleChange} placeholder="0" required />
                                        </div>
                                    </div>

                                    <div className={styles.row}>
                                        <div className={styles.formGroup}>
                                            <label>Tenure (Months)</label>
                                            <input name="tenure" type="number" value={formData.tenure} onChange={handleChange} placeholder="0" required />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>First EMI Date</label>
                                            <input name="firstEmiDate" type="date" value={formData.firstEmiDate} onChange={handleChange} required />
                                        </div>
                                    </div>

                                </>
                            )}

                            <div className={styles.formGroup}>
                                <label>Total Payable</label>
                                <input type="text" value={totalPayable.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} className={styles.nonEditable} readOnly />
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className={styles.totalSummary}>
                                <label>TOTAL PAYABLE</label>
                                <span>{totalPayable.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                            </div>
                            <div className={styles.scheduleWrapper}>
                                <div className={styles.scheduleHeader}>
                                    <span>#</span>
                                    <span>Date</span>
                                    <span>Amount</span>
                                    <span style={{ textAlign: 'center' }}>Paid</span>
                                </div>
                                {formData.schedule.map((p, idx) => (
                                    <div key={p.id} className={styles.paymentItem}>
                                        <span className={styles.indexLabel}>{idx + 1}</span>
                                        <div className={styles.dateCell}>
                                            <input
                                                type="date"
                                                value={p.date}
                                                onChange={(e) => handleScheduleChange(idx, 'date', e.target.value)}
                                                className={styles.scheduleDateInput}
                                            />
                                        </div>
                                        <input type="number" value={p.amount} onChange={(e) => handleScheduleChange(idx, 'amount', e.target.value)} />
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={p.isPaid}
                                                onChange={(e) => handleScheduleChange(idx, 'isPaid', e.target.checked)}
                                                style={{ width: '18px', height: '18px' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <div className={styles.insightSection}>
                            <div className={styles.insightGrid}>
                                <div className={styles.insightCard}>
                                    <span className={styles.insightLabel}>Effective Interest Rate (%)</span>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', justifyContent: 'center' }}>
                                        <input
                                            name="interestRate"
                                            type="number"
                                            step="0.01"
                                            value={formData.interestRate}
                                            onChange={handleChange}
                                            className={styles.insightValue}
                                            style={{ width: '80px', border: 'none', background: 'transparent', textAlign: 'right', fontSize: '1.25rem', fontWeight: 700, padding: 0 }}
                                        />
                                        <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>%</span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', display: 'block', textAlign: 'center', marginTop: '4px' }}>
                                        Interest: {formatCurrency(Math.max(0, totalPayable - (
                                            (formData.loanType === 'Personal'
                                                ? (parseFloat(formData.creditedAmount) || 0)
                                                : ((parseFloat(formData.productAmount) || 0) - (parseFloat(formData.downpaymentAmount) || 0))) - totalUpfront
                                        )))}
                                    </span>
                                </div>

                                {formData.loanType === 'Personal' ? (
                                    <>
                                        <div className={styles.insightCard}>
                                            <span className={styles.insightLabel}>Loan Amount</span>
                                            <span className={styles.insightValue}>{formatCurrency(formData.loanAmount || 0)}</span>
                                        </div>
                                        <div className={styles.insightCard}>
                                            <span className={styles.insightLabel}>Amount Credited</span>
                                            <span className={styles.insightValue}>{formatCurrency(formData.creditedAmount || 0)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.insightCard}>
                                        <span className={styles.insightLabel}>Product Amount</span>
                                        <span className={styles.insightValue}>{formatCurrency(formData.productAmount || 0)}</span>
                                    </div>
                                )}

                                <div className={styles.insightCard}>
                                    <span className={styles.insightLabel}>Total Payable</span>
                                    <span className={styles.insightValue}>{formatCurrency(totalPayable)}</span>
                                </div>
                            </div>

                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label>Processing Fee (Base)</label>
                                    <input name="processingFee" type="number" value={formData.processingFee} onChange={handleChange} placeholder="0" />
                                    <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                                        GST (18%): {formatCurrency(gstAmount)}
                                    </span>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Other Charges</label>
                                    <input name="otherCharges" type="number" value={formData.otherCharges} onChange={handleChange} placeholder="0" />
                                </div>
                            </div>

                            <div className={styles.adviceBox} style={{ borderColor: advice.color, color: advice.color, background: `${advice.color}10`, marginTop: '1rem' }}>
                                <strong>Loan Advice:</strong><br />
                                {advice.text}
                            </div>
                        </div>
                    )}

                    <div className={styles.actions}>
                        {step > 1 && (
                            <button type="button" onClick={handleBack} className={styles.cancelBtn}>Back</button>
                        )}
                        <button type="button" onClick={onClose} className={styles.cancelBtn} style={{ textDecoration: 'none' }}>Cancel</button>

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className={styles.submitBtn}
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={styles.submitBtn}
                            >
                                {isSubmitting ? 'Saving...' : (isEditMode ? 'Confirm Update' : 'Finish & Add Loan')}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
