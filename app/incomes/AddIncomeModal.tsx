'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { addIncomeEntry } from '@/app/actions/incomeActions';
import styles from './addIncomeModal.module.css';

interface AddIncomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AddIncomeModal({ isOpen, onClose, onSuccess }: AddIncomeModalProps) {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            const result = await addIncomeEntry(formData);
            if (result.success) {
                if (onSuccess) onSuccess();
                onClose();
            } else {
                alert(result.error || 'Failed to add income');
            }
        } catch (error) {
            alert('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Add Income</h2>
                    <button onClick={onClose} className={styles.closeBtn} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.group}>
                        <label>Source / Employer</label>
                        <input 
                            name="source" 
                            type="text" 
                            placeholder="e.g. Salary, Side Project, Freelance" 
                            className={styles.input}
                            required 
                            autoFocus 
                        />
                    </div>

                    <div className={styles.grid}>
                        <div className={styles.group}>
                            <label>Amount</label>
                            <input 
                                name="amount" 
                                type="number" 
                                step="0.01"
                                placeholder="0.00" 
                                className={styles.input}
                                required 
                            />
                        </div>

                        <div className={styles.group}>
                            <label>Category</label>
                            <select name="category" className={styles.select}>
                                <option value="Salary">Salary</option>
                                <option value="Freelance">Freelance</option>
                                <option value="Dividends">Dividends</option>
                                <option value="I/O">I/O</option>
                                <option value="Gift">Gift</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.grid}>
                        <div className={styles.group}>
                            <label>Date</label>
                            <input 
                                name="date" 
                                type="date" 
                                defaultValue={new Date().toISOString().split('T')[0]}
                                className={styles.input}
                                required 
                            />
                        </div>

                        <div className={styles.group}>
                            <label>Status</label>
                            <select name="status" className={styles.select}>
                                <option value="Received">Received</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.group}>
                        <label>Notes</label>
                        <textarea 
                            name="notes" 
                            placeholder="Optional notes or description..." 
                            className={styles.textarea}
                        ></textarea>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Adding...' : 'Add Income Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
