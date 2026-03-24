'use client';

import React, { useState, useEffect } from 'react';
import { X, Zap, ArrowRight, Settings } from 'lucide-react';
import { addIncomeEntry } from '@/app/actions/incomeActions';
import styles from './quickSalaryModal.module.css';

interface QuickSalaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    baseSalary: number;
    onSuccess?: () => void;
    onOpenSettings?: () => void;
}

const formatAmount = (value: number) => {
    return `₹${value.toLocaleString('en-IN')}`;
};

export default function QuickSalaryModal({ 
    isOpen, 
    onClose, 
    baseSalary, 
    onSuccess,
    onOpenSettings 
}: QuickSalaryModalProps) {
    const [incentives, setIncentives] = useState<string>('0');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) setIncentives('0');
    }, [isOpen]);

    if (!isOpen) return null;

    const totalAmount = baseSalary + (parseFloat(incentives) || 0);

    const handleQuickAdd = async () => {
        setLoading(true);
        const formData = new FormData();
        formData.append('amount', totalAmount.toString());
        formData.append('source', 'Salary');
        formData.append('category', 'Salary');
        formData.append('status', 'Received');
        formData.append('date', new Date().toISOString().split('T')[0]);
        
        const incentiveVal = parseFloat(incentives) || 0;
        if (incentiveVal > 0) {
            formData.append('notes', `Includes base salary ${formatAmount(baseSalary)} and ${formatAmount(incentiveVal)} incentive.`);
        } else {
            formData.append('notes', 'Monthly base salary payout.');
        }

        try {
            const result = await addIncomeEntry(formData);
            if (result.success) {
                if (onSuccess) onSuccess();
                onClose();
            } else {
                alert(result.error || 'Failed to add salary');
            }
        } catch (error) {
            alert('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Quick Salary</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.salaryDisplay}>
                        <span className={styles.label}>Base Salary</span>
                        <h1 className={styles.amount}>{formatAmount(baseSalary)}</h1>
                    </div>

                    <div className={styles.incentiveSection}>
                        <div className={styles.inputGroup}>
                            <label>Incentives / Bonus</label>
                            <input 
                                type="number" 
                                className={styles.input} 
                                value={incentives}
                                onChange={(e) => setIncentives(e.target.value)}
                                placeholder="0"
                                autoFocus
                            />
                        </div>

                        <div className={styles.totalRow}>
                            <span className={styles.totalLabel}>Grand Total</span>
                            <span className={styles.totalValue}>{formatAmount(totalAmount)}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button 
                        className={styles.submitBtn} 
                        onClick={handleQuickAdd}
                        disabled={loading || baseSalary <= 0}
                    >
                        <Zap size={18} fill="currentColor" />
                        {loading ? 'Adding...' : 'Confirm & Add Salary'}
                    </button>
                    
                    <button className={styles.settingsLink} onClick={onOpenSettings}>
                        <Settings size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        Change default salary
                    </button>
                </div>
            </div>
        </div>
    );
}
