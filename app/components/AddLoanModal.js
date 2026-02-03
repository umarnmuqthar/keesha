'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import styles from './AddLoanModal.module.css';
import { addLoan, updateLoan } from '../actions';
import { generatePaymentSchedule, getLoanAdvice, formatScheduleDate } from '@/lib/loan-utils';

export default function AddLoanModal({ isOpen, onClose, initialData = null, existingNames = [] }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nameError, setNameError] = useState('');
    const [interestRateError, setInterestRateError] = useState('');
    const [rawInterestRate, setRawInterestRate] = useState(null);
    const [creditedAmountError, setCreditedAmountError] = useState('');
    const [reconcileError, setReconcileError] = useState('');
    const [scheduleError, setScheduleError] = useState('');
    const [paidToggleError, setPaidToggleError] = useState('');
    const [showNextError, setShowNextError] = useState(false);
    const [focusedField, setFocusedField] = useState('');
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
        gstIncluded: initialData?.gstIncluded ?? true,
        schedule: initialData?.schedule || []
    });

    const isEditMode = !!initialData;

    const formatCurrency = (amount) => {
        const num = Number(amount) || 0;
        const hasDecimals = Math.abs(num % 1) > 0;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: hasDecimals ? 2 : 0,
            maximumFractionDigits: 2
        }).format(num);
    };

    const formatNumberString = (value) => {
        if (value === '' || value === null || typeof value === 'undefined') return '';
        const raw = String(value).replace(/,/g, '');
        const num = Number(raw);
        if (Number.isNaN(num)) return value;
        const hasDecimals = raw.includes('.') && Number(raw.split('.')[1] || 0) > 0;
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: hasDecimals ? 2 : 0,
            maximumFractionDigits: 2
        }).format(num);
    };

    const normalizeNumberString = (value) => {
        if (value === '' || value === null || typeof value === 'undefined') return '';
        const raw = String(value).replace(/,/g, '');
        if (raw === '') return '';
        const num = Number(raw);
        if (Number.isNaN(num)) return '';
        const fixed = num.toFixed(2);
        return fixed.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
    };

    const getDisplayValue = (name, rawValue) => {
        return focusedField === name ? rawValue : formatNumberString(rawValue);
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
        gstIncluded: true,
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
                    gstIncluded: initialData?.gstIncluded ?? true,
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

    const principalBase = useMemo(() => {
        return formData.loanType === 'Personal'
            ? (parseFloat(formData.creditedAmount) || 0)
            : ((parseFloat(formData.productAmount) || 0) - (parseFloat(formData.downpaymentAmount) || 0));
    }, [formData.loanType, formData.creditedAmount, formData.productAmount, formData.downpaymentAmount]);

    const loanPrincipal = useMemo(() => {
        return formData.loanType === 'Personal'
            ? (parseFloat(formData.loanAmount) || 0)
            : (parseFloat(formData.productAmount) || 0);
    }, [formData.loanType, formData.loanAmount, formData.productAmount]);

    const gstAmount = useMemo(() => {
        // GST is 18% of the Processing Fee (base)
        if (!formData.gstIncluded) return 0;
        return (parseFloat(formData.processingFee) || 0) * 0.18;
    }, [formData.processingFee, formData.gstIncluded]);

    const totalUpfront = useMemo(() => {
        return (parseFloat(formData.processingFee) || 0) +
            gstAmount +
            (parseFloat(formData.otherCharges) || 0);
    }, [formData.processingFee, gstAmount, formData.otherCharges]);

    const netPrincipal = useMemo(() => {
        return principalBase - totalUpfront;
    }, [principalBase, totalUpfront]);

    const upfrontError = useMemo(() => {
        if (netPrincipal < 0) {
            return 'Processing fee (incl. GST if enabled) + other charges exceed net principal.';
        }
        return '';
    }, [netPrincipal]);

    const feeMismatch = useMemo(() => {
        if (formData.loanAmount === '' || formData.creditedAmount === '') return '';
        const totalFees = (parseFloat(formData.processingFee) || 0) + gstAmount + (parseFloat(formData.otherCharges) || 0);
        const expected = (totalPayable - loanPrincipal);
        const diff = expected - totalFees;
        if (Math.abs(diff) > 0.01) {
            return `Processing Fee + GST + Other Charges should equal Total Payable - Loan Amount. Difference: ${formatCurrency(diff)}.`;
        }
        return '';
    }, [totalPayable, loanPrincipal, formData.processingFee, formData.otherCharges, formData.loanAmount, formData.creditedAmount, gstAmount]);

    const payableMismatch = useMemo(() => {
        if (loanPrincipal <= 0) return '';
        if (totalPayable + 0.01 < loanPrincipal) {
            return 'Total payable cannot be less than loan amount.';
        }
        return '';
    }, [loanPrincipal, totalPayable]);

    const scheduleDateOrderMismatch = useMemo(() => {
        if (!formData.schedule || formData.schedule.length === 0) return '';
        const dates = formData.schedule.map(item => new Date(item.date).getTime());
        for (let i = 1; i < dates.length; i++) {
            if (dates[i] < dates[i - 1]) {
                return 'Payment dates must be in chronological order.';
            }
        }
        return '';
    }, [formData.schedule]);

    const paidFutureMismatch = useMemo(() => {
        if (!formData.schedule || formData.schedule.length === 0) return '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const hasFuturePaid = formData.schedule.some(item => {
            if (!item.isPaid) return false;
            const date = new Date(item.date);
            date.setHours(0, 0, 0, 0);
            return date > today;
        });
        if (hasFuturePaid) {
            return 'Cannot mark future installments as paid.';
        }
        return '';
    }, [formData.schedule]);

    const paidAmountMismatch = useMemo(() => {
        if (!formData.schedule || formData.schedule.length === 0) return '';
        const hasZeroPaid = formData.schedule.some(item => item.isPaid && (parseFloat(item.amount) || 0) <= 0);
        if (hasZeroPaid) {
            return 'Paid installments must have an amount greater than 0.';
        }
        return '';
    }, [formData.schedule]);

    const latestPaidPastIndex = useMemo(() => {
        if (!formData.schedule || formData.schedule.length === 0) return -1;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let latestIndex = -1;
        formData.schedule.forEach((item, idx) => {
            const date = new Date(item.date);
            date.setHours(0, 0, 0, 0);
            if (item.isPaid && date <= today) {
                latestIndex = idx;
            }
        });
        return latestIndex;
    }, [formData.schedule]);

    // Use a ref to track if the last change was manual to interest rate
    const isManualInterestRef = useRef(false);
    const isManualFeeRef = useRef(false);
    useEffect(() => {
        isManualInterestRef.current = false;
    }, [formData.processingFee, formData.otherCharges, formData.creditedAmount, formData.productAmount, formData.downpaymentAmount, formData.schedule]);

    useEffect(() => {
        if (!isOpen) return;
        const targetTotalFees = Math.max(0, totalPayable - loanPrincipal);
        const otherChargesValue = parseFloat(formData.otherCharges) || 0;
        let desiredProcessingFee = 0;

        if (formData.gstIncluded) {
            desiredProcessingFee = (targetTotalFees - otherChargesValue) / 1.18;
        } else {
            desiredProcessingFee = targetTotalFees - otherChargesValue;
        }

        desiredProcessingFee = Math.max(0, desiredProcessingFee);

        if (!isManualFeeRef.current) {
            const currentFee = parseFloat(formData.processingFee) || 0;
            if (Math.abs(currentFee - desiredProcessingFee) > 0.01 || formData.processingFee === '') {
                setFormData(prev => ({
                    ...prev,
                    processingFee: normalizeNumberString(desiredProcessingFee)
                }));
            }
            return;
        }

        const currentFee = parseFloat(formData.processingFee) || 0;
        const remaining = Math.max(0, targetTotalFees - (currentFee + gstAmount));
        if (Math.abs((parseFloat(formData.otherCharges) || 0) - remaining) > 0.01) {
            setFormData(prev => ({
                ...prev,
                otherCharges: normalizeNumberString(remaining)
            }));
        }
    }, [isOpen, formData.processingFee, formData.otherCharges, totalPayable, loanPrincipal, gstAmount, formData.gstIncluded]);

    useEffect(() => {
        if (!isOpen) return;

        if (netPrincipal <= 0) {
            setInterestRateError('Net principal must be positive to calculate rate.');
            setRawInterestRate(0);
            if (!isManualInterestRef.current) {
                setFormData(prev => ({ ...prev, interestRate: '0.00' }));
            }
            return;
        }

        const interestGap = totalPayable - loanPrincipal;
        if (interestGap <= 0 || loanPrincipal <= 0) {
            setRawInterestRate(0);
            setInterestRateError('');
            if (!isManualInterestRef.current) {
                setFormData(prev => ({ ...prev, interestRate: '0.00' }));
            }
            return;
        }

        const simpleRate = (interestGap / loanPrincipal) * 100;
        setRawInterestRate(simpleRate);
        setInterestRateError('');

        // Auto-update ONLY if interestRate is empty (initial load of step 3)
        // Subsequent changes to fees will be handled by this effect IF the user hasn't typed in interestRate?
        // Actually, user wants "Which ever field is adjusted change the other fields accordingly".
        // To avoid loops, we'll only auto-calculate if the change didn't come from interestRate itself.
        // We'll trust the dependency array. 
        // We only update if this effect was triggered by a fee change.
        if (formData.interestRate === '' || formData.interestRate === '0.00' || !isManualInterestRef.current) {
            setFormData(prev => ({ ...prev, interestRate: simpleRate.toFixed(2) }));
        }
    }, [formData.creditedAmount, formData.productAmount, formData.schedule, totalUpfront, isOpen, formData.loanType, formData.downpaymentAmount, totalPayable, loanPrincipal]);

    useEffect(() => {
        setReconcileError(feeMismatch || payableMismatch);
    }, [feeMismatch, payableMismatch]);

    useEffect(() => {
        setScheduleError(scheduleDateOrderMismatch || paidFutureMismatch || paidAmountMismatch);
    }, [scheduleDateOrderMismatch, paidFutureMismatch, paidAmountMismatch]);

    useEffect(() => {
        if (!paidFutureMismatch && !paidAmountMismatch) {
            setPaidToggleError('');
        }
    }, [paidFutureMismatch, paidAmountMismatch]);

    const handleUpfrontChange = (name, value) => {
        // This is now handled by standard handleChange or specific needs if any
        // But the user asked to remove "Total Upfront Cost" field, so we just use handleChange
    };

    const advice = useMemo(() => {
        const rateForAdvice = rawInterestRate !== null ? Math.max(0, rawInterestRate) : formData.interestRate;
        return getLoanAdvice(rateForAdvice);
    }, [formData.interestRate, rawInterestRate]);

    const tinyRateHint = useMemo(() => {
        if (rawInterestRate === null) return '';
        if (rawInterestRate > 0 && rawInterestRate < 0.01) {
            return 'Effective rate < 0.01% (rounded).';
        }
        return '';
    }, [rawInterestRate]);

    const canProceedStep1 = useMemo(() => {
        const nameOk = formData.name && formData.name.trim().length > 0;
        if (formData.loanType === 'Personal') {
            const loanAmountOk = (parseFloat(formData.loanAmount) || 0) > 0;
            const creditedOk = (parseFloat(formData.creditedAmount) || 0) > 0;
            const emiOk = (parseFloat(formData.emiAmount) || 0) > 0;
            const tenureOk = (parseInt(formData.tenure) || 0) > 0;
            const dateOk = !!formData.firstEmiDate;
            return nameOk && loanAmountOk && creditedOk && emiOk && tenureOk && dateOk;
        }
        const productOk = (parseFloat(formData.productAmount) || 0) > 0;
        const emiOk = (parseFloat(formData.emiAmount) || 0) > 0;
        const tenureOk = (parseInt(formData.tenure) || 0) > 0;
        const dateOk = !!formData.firstEmiDate;
        const downpaymentOk = !formData.hasDownpayment || (parseFloat(formData.downpaymentAmount) || 0) >= 0;
        return nameOk && productOk && emiOk && tenureOk && dateOk && downpaymentOk;
    }, [formData]);

    const nextDisabledReason = useMemo(() => {
        if (step === 1 && !canProceedStep1) {
            return 'Fill all required fields to continue.';
        }
        if (step === 2) {
            if (scheduleError) return scheduleError;
            if (paidToggleError) return paidToggleError;
        }
        return '';
    }, [step, canProceedStep1, scheduleError, paidToggleError]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const moneyFields = new Set([
            'loanAmount',
            'creditedAmount',
            'emiAmount',
            'downpaymentAmount',
            'productAmount',
            'processingFee',
            'otherCharges'
        ]);

        if (name === 'loanAmount' || name === 'creditedAmount') {
            if (value !== '' && String(value).trim().startsWith('-')) {
                setCreditedAmountError(name === 'creditedAmount' ? 'Amount credited cannot be negative.' : '');
                setFormData(prev => ({ ...prev, [name]: '0' }));
                return;
            }
            isManualFeeRef.current = false;
            if (name === 'creditedAmount') {
                setCreditedAmountError('');
            }
        }

        if (name === 'interestRate') {
            isManualInterestRef.current = true;
            // Manual Interest -> Other Charges Solver
            if (value === '') {
                setInterestRateError('');
                setRawInterestRate(null);
                setFormData(prev => ({ ...prev, interestRate: '' }));
                return;
            }
            if (value !== '' && String(value).trim().startsWith('-')) {
                setInterestRateError('Interest rate cannot be negative.');
                setFormData(prev => ({ ...prev, interestRate: '0.00' }));
                setRawInterestRate(0);
                return;
            }

            const r = Math.max(0, parseFloat(value) || 0);
            setInterestRateError('');
            setRawInterestRate(r);
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

                const currentTotalFee = (parseFloat(formData.processingFee) || 0) + gstAmount;
                const newOtherCharges = requiredTotalUpfront - currentTotalFee;

                setFormData(prev => ({
                    ...prev,
                    interestRate: value === '' ? '' : r.toFixed(2),
                    otherCharges: Math.max(0, newOtherCharges).toFixed(2)
                }));
            } else {
                setFormData(prev => ({ ...prev, interestRate: value === '' ? '' : r.toFixed(2) }));
            }
            return;
        }

        if (name === 'processingFee') {
            isManualFeeRef.current = true;
            if (value !== '' && String(value).trim().startsWith('-')) {
                setFormData(prev => ({ ...prev, processingFee: '0' }));
                return;
            }
            const rawValue = value.replace(/,/g, '');
            const feeValue = parseFloat(rawValue) || 0;
            const targetTotalFees = Math.max(0, totalPayable - loanPrincipal);
            const remaining = Math.max(0, targetTotalFees - (feeValue + gstAmount));
            setFormData(prev => ({
                ...prev,
                processingFee: value === '' ? '' : rawValue,
                otherCharges: normalizeNumberString(remaining)
            }));
            return;
        }

        if (name === 'otherCharges') {
            if (value !== '' && String(value).trim().startsWith('-')) {
                setFormData(prev => ({ ...prev, otherCharges: '0' }));
                return;
            }
            isManualFeeRef.current = false;
            const rawValue = value.replace(/,/g, '');
            setFormData(prev => ({
                ...prev,
                otherCharges: value === '' ? '' : rawValue
            }));
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

        if (moneyFields.has(name)) {
            const rawValue = value.replace(/,/g, '');
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : rawValue
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleNext = (e) => {
        if (e) e.preventDefault();
        if (step === 1) {
            if (!canProceedStep1) {
                setShowNextError(true);
                return;
            }
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
            setShowNextError(false);
        } else if (step === 2) {
            if (scheduleError || paidToggleError) {
                setShowNextError(true);
                return;
            }
            setStep(3);
            setShowNextError(false);
        }
    };

    const handleBack = () => {
        setShowNextError(false);
        setStep(prev => prev - 1);
    };

    const handleScheduleChange = (index, field, value) => {
        let newSchedule = [...formData.schedule];
        if (field === 'day') {
            const currentDate = newSchedule[index].date;
            const [year, month] = currentDate.split('-');
            const y = parseInt(year);
            const m = parseInt(month);
            const lastDay = new Date(y, m, 0).getDate();
            const day = Math.min(parseInt(value), lastDay);
            newSchedule[index] = { ...newSchedule[index], date: `${year}-${month}-${String(day).padStart(2, '0')}` };
        } else if (field === 'isPaid') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const paymentDate = new Date(newSchedule[index].date);
            paymentDate.setHours(0, 0, 0, 0);
            const amount = parseFloat(newSchedule[index].amount) || 0;
            const isFuture = paymentDate > today;
            if (isFuture) {
                setPaidToggleError('Future installments cannot be marked as paid.');
                return;
            }
            if (!value && index !== latestPaidPastIndex) {
                setPaidToggleError('Only the latest paid installment can be unchecked.');
                return;
            }
            if (value === true && amount <= 0) {
                setPaidToggleError('Paid installments must have an amount greater than 0.');
                return;
            }
            setPaidToggleError('');
            if (value === true) {
                newSchedule = newSchedule.map((item, idx) => {
                    if (idx <= index) {
                        return { ...item, isPaid: true };
                    }
                    return item;
                });
            } else {
                newSchedule[index] = { ...newSchedule[index], isPaid: value };
            }
        } else {
            if (field === 'amount') {
                const rawValue = String(value).replace(/,/g, '');
                newSchedule[index] = { ...newSchedule[index], amount: rawValue };
            } else {
                newSchedule[index] = { ...newSchedule[index], [field]: value };
            }
        }
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
                                <label>Loan Name<span className={styles.requiredStar}>*</span></label>
                                <input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="e.g. Home Loan" required />
                                {nameError && <span className={styles.errorMessage}>{nameError}</span>}
                            </div>

                            {formData.loanType === 'Personal' ? (
                                <>
                                    <div className={styles.row}>
                                        <div className={styles.formGroup}>
                                            <label>Loan Amount<span className={styles.requiredStar}>*</span></label>
                                            <input
                                                name="loanAmount"
                                                type="text"
                                                inputMode="decimal"
                                                pattern="^\\d*(\\.\\d{0,2})?$"
                                                value={getDisplayValue('loanAmount', formData.loanAmount)}
                                                onFocus={() => setFocusedField('loanAmount')}
                                                onBlur={() => setFocusedField('')}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Credited Amount<span className={styles.requiredStar}>*</span></label>
                                            <input
                                                name="creditedAmount"
                                                type="text"
                                                inputMode="decimal"
                                                pattern="^\\d*(\\.\\d{0,2})?$"
                                                value={getDisplayValue('creditedAmount', formData.creditedAmount)}
                                                onFocus={() => setFocusedField('creditedAmount')}
                                                onBlur={() => setFocusedField('')}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                                required
                                            />
                                            {creditedAmountError && <span className={styles.errorMessage}>{creditedAmountError}</span>}
                                        </div>
                                    </div>

                                    <div className={styles.row}>
                                        <div className={styles.formGroup}>
                                            <label>Monthly EMI<span className={styles.requiredStar}>*</span></label>
                                            <input
                                                name="emiAmount"
                                                type="text"
                                                inputMode="decimal"
                                                pattern="^\\d*(\\.\\d{0,2})?$"
                                                value={getDisplayValue('emiAmount', formData.emiAmount)}
                                                onFocus={() => setFocusedField('emiAmount')}
                                                onBlur={() => setFocusedField('')}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Tenure (Months)<span className={styles.requiredStar}>*</span></label>
                                            <input name="tenure" type="number" value={formData.tenure} onChange={handleChange} placeholder="0" required />
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>First EMI Date<span className={styles.requiredStar}>*</span></label>
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
                                            <input
                                                name="downpaymentAmount"
                                                type="text"
                                                inputMode="decimal"
                                                pattern="^\\d*(\\.\\d{0,2})?$"
                                                value={getDisplayValue('downpaymentAmount', formData.downpaymentAmount)}
                                                onFocus={() => setFocusedField('downpaymentAmount')}
                                                onBlur={() => setFocusedField('')}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    )}

                                    <div className={styles.row}>
                                        <div className={styles.formGroup}>
                                            <label>Product Amount<span className={styles.requiredStar}>*</span></label>
                                            <input
                                                name="productAmount"
                                                type="text"
                                                inputMode="decimal"
                                                pattern="^\\d*(\\.\\d{0,2})?$"
                                                value={getDisplayValue('productAmount', formData.productAmount)}
                                                onFocus={() => setFocusedField('productAmount')}
                                                onBlur={() => setFocusedField('')}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Monthly EMI<span className={styles.requiredStar}>*</span></label>
                                            <input
                                                name="emiAmount"
                                                type="text"
                                                inputMode="decimal"
                                                pattern="^\\d*(\\.\\d{0,2})?$"
                                                value={getDisplayValue('emiAmount', formData.emiAmount)}
                                                onFocus={() => setFocusedField('emiAmount')}
                                                onBlur={() => setFocusedField('')}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.row}>
                                        <div className={styles.formGroup}>
                                            <label>Tenure (Months)<span className={styles.requiredStar}>*</span></label>
                                            <input name="tenure" type="number" value={formData.tenure} onChange={handleChange} placeholder="0" required />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>First EMI Date<span className={styles.requiredStar}>*</span></label>
                                            <input name="firstEmiDate" type="date" value={formData.firstEmiDate} onChange={handleChange} required />
                                        </div>
                                    </div>

                                </>
                            )}

                            <div className={styles.formGroup}>
                                <label>Total Payable</label>
                                <input type="text" value={formatCurrency(totalPayable)} className={styles.nonEditable} readOnly />
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className={styles.totalSummary}>
                                <label>TOTAL PAYABLE</label>
                                <span>{formatCurrency(totalPayable)}</span>
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
                                            <div className={styles.dateDisplay}>
                                                <span>{new Date(p.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
                                                <select
                                                    value={parseInt(p.date.split('-')[2])}
                                                    onChange={(e) => handleScheduleChange(idx, 'day', e.target.value)}
                                                    className={styles.daySelect}
                                                >
                                                    {Array.from({ length: new Date(p.date.split('-')[0], p.date.split('-')[1], 0).getDate() }, (_, i) => i + 1).map(day => (
                                                        <option key={day} value={day}>{day}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            pattern="^\\d*(\\.\\d{0,2})?$"
                                            value={getDisplayValue(`schedule-amount-${idx}`, p.amount)}
                                            onFocus={() => setFocusedField(`schedule-amount-${idx}`)}
                                            onBlur={() => setFocusedField('')}
                                            onChange={(e) => handleScheduleChange(idx, 'amount', e.target.value)}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            {(() => {
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                const date = new Date(p.date);
                                                date.setHours(0, 0, 0, 0);
                                                const isFuture = date > today;
                                                const disableUncheck = p.isPaid && idx !== latestPaidPastIndex;
                                                const isDisabled = isFuture || disableUncheck;
                                                return (
                                                    <input
                                                        type="checkbox"
                                                        checked={p.isPaid}
                                                        disabled={isDisabled}
                                                        onChange={(e) => handleScheduleChange(idx, 'isPaid', e.target.checked)}
                                                        style={{ width: '18px', height: '18px' }}
                                                    />
                                                );
                                            })()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {scheduleError && <span className={styles.errorMessage}>{scheduleError}</span>}
                            {paidToggleError && <span className={styles.errorMessage}>{paidToggleError}</span>}
                        </>
                    )}

                    {step === 3 && (
                        <div className={styles.insightSection}>
                            <div className={styles.insightGrid}>
                                <div className={styles.insightCard}>
                                    <span className={styles.insightLabel}>Effective Interest Rate (%)</span>
                                    <div className={styles.interestRateRow}>
                                        <span className={styles.interestRateValue}>{formData.interestRate || '0.00'}</span>
                                        <span className={styles.interestRateSuffix}>%</span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', display: 'block', textAlign: 'center', marginTop: '4px' }}>
                                        Interest: {formatCurrency(Math.max(0, totalPayable - loanPrincipal))}
                                    </span>
                                    {tinyRateHint && (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'block', textAlign: 'center', marginTop: '2px' }}>
                                            {tinyRateHint}
                                        </span>
                                    )}
                                    {interestRateError && <span className={styles.errorMessage} style={{ textAlign: 'center' }}>{interestRateError}</span>}
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
                                    <label>Processing Fee</label>
                                    <input
                                        name="processingFee"
                                        type="text"
                                        inputMode="decimal"
                                        pattern="^\\d*(\\.\\d{0,2})?$"
                                        value={getDisplayValue('processingFee', formData.processingFee)}
                                        onFocus={() => setFocusedField('processingFee')}
                                        onBlur={() => setFocusedField('')}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                    />
                                    <label className={styles.checkboxRow} style={{ marginTop: '0.25rem' }}>
                                        <input
                                            name="gstIncluded"
                                            type="checkbox"
                                            checked={formData.gstIncluded}
                                            onChange={handleChange}
                                        />
                                        Apply GST (18%)
                                    </label>
                                    <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                                        GST (18%): {formatCurrency(gstAmount)}
                                    </span>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Other Charges</label>
                                    <input
                                        name="otherCharges"
                                        type="text"
                                        inputMode="decimal"
                                        pattern="^\\d*(\\.\\d{0,2})?$"
                                        value={getDisplayValue('otherCharges', formData.otherCharges)}
                                        onFocus={() => setFocusedField('otherCharges')}
                                        onBlur={() => setFocusedField('')}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            {upfrontError && <span className={styles.errorMessage}>{upfrontError}</span>}
                            {reconcileError && <span className={styles.errorMessage}>{reconcileError}</span>}

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
                                disabled={(step === 1 && !canProceedStep1) || (step === 2 && (!!scheduleError || !!paidToggleError))}
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isSubmitting || !!upfrontError || !!reconcileError || !!creditedAmountError || !!scheduleError || !!paidToggleError}
                                className={styles.submitBtn}
                            >
                                {isSubmitting ? 'Saving...' : (isEditMode ? 'Confirm Update' : 'Finish & Add Loan')}
                            </button>
                        )}
                    </div>
                    {step < 3 && showNextError && nextDisabledReason && (
                        <span className={styles.errorMessage} style={{ marginTop: '0.25rem', textAlign: 'right' }}>
                            {nextDisabledReason}
                        </span>
                    )}
                </form>
            </div>
        </div>,
        document.body
    );
}
