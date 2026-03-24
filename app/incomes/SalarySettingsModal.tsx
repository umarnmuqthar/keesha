'use client';

import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { updateProfile } from '@/app/actions/profileActions';
import styles from './addIncomeModal.module.css'; // Reusing add modal styles for consistency

interface SalarySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentSalary: number;
    onSuccess?: () => void;
}

export default function SalarySettingsModal({ 
    isOpen, 
    onClose, 
    currentSalary,
    onSuccess 
}: SalarySettingsModalProps) {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            const result = await updateProfile(formData);
            if (result.success) {
                if (onSuccess) onSuccess();
                onClose();
            } else {
                alert(result.message || 'Failed to update salary');
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
                    <h2>Salary Settings</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.group}>
                        <label>Default Monthly Salary</label>
                        <input 
                            name="baseSalary" 
                            type="number" 
                            defaultValue={currentSalary || ''}
                            placeholder="e.g. 85000" 
                            className={styles.input}
                            required 
                            autoFocus 
                        />
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>
                            This amount will be used as the default for the Quick Add Salary feature.
                        </p>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            <Save size={18} style={{ marginRight: '8px' }} />
                            {loading ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
