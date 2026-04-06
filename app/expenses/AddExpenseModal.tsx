'use client';

import React, { useState } from 'react';
import styles from './addExpenseModal.module.css';
import { addExpense } from '@/app/actions/expenseActions';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export default function AddExpenseModal({ isOpen, onClose, onExpenseAdded }: { isOpen: boolean; onClose: () => void; onExpenseAdded?: () => void }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await addExpense(formData);
        if (result.success) {
            router.refresh();
            if (onExpenseAdded) onExpenseAdded();
            onClose();
        } else {
            alert(result.message || 'Something went wrong');
        }
        setLoading(false);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Quick Expense Entry</h2>
                    <button onClick={onClose} className={styles.closeBtn} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.group}>
                        <label>Amount</label>
                        <input name="amount" type="number" placeholder="0.00" required autoFocus />
                    </div>

                    <div className={styles.group}>
                        <label>Description</label>
                        <input name="description" type="text" placeholder="What did you buy?" required />
                    </div>

                    <div className={styles.grid}>
                        <div className={styles.group}>
                            <label>Category</label>
                            <select name="category">
                                <option value="Food">Food</option>
                                <option value="Fuel">Fuel</option>
                                <option value="Shopping">Shopping</option>
                                <option value="Travel">Travel</option>
                                <option value="Bills">Bills</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="General">General</option>
                            </select>
                        </div>

                        <div className={styles.group}>
                            <label>Date</label>
                            <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Adding...' : 'Add Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
