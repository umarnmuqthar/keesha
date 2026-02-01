'use client';

import React, { useState } from 'react';
import styles from './AddDebtModal.module.css';
import { addDebtAccount } from '../actions/debtActions';
import { useRouter } from 'next/navigation';

export default function AddDebtModal({ isOpen, onClose }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        const result = await addDebtAccount(formData);
        if (result.success) {
            router.refresh();
            onClose();
        } else {
            alert(result.error || 'Something went wrong');
        }
        setLoading(false);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>New Debt Account</h2>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.group}>
                        <label>Person / Entity Name</label>
                        <input name="name" type="text" placeholder="e.g. Akshay, Family Sulu" required autoFocus />
                    </div>

                    <div className={styles.group}>
                        <label>Account Type</label>
                        <select name="type">
                            <option value="Friend">Friend</option>
                            <option value="Family">Family</option>
                            <option value="Business">Business</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
