'use client';

import React, { useState } from 'react';
import styles from './AddDebtModal.module.css'; // Reusing styles 
import { updateDebtAccount } from '../actions/debtActions';

export default function EditDebtModal({ isOpen, onClose, account }) {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        const result = await updateDebtAccount(account.id, formData);
        if (result.success) {
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
                    <h2>Edit Debt Account</h2>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.group}>
                        <label>Person / Entity Name</label>
                        <input
                            name="name"
                            type="text"
                            defaultValue={account.name}
                            required
                            autoFocus
                        />
                    </div>

                    <div className={styles.group}>
                        <label>Account Type</label>
                        <select name="type" defaultValue={account.type}>
                            <option value="Friend">Friend</option>
                            <option value="Family">Family</option>
                            <option value="Business">Business</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Updating...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
