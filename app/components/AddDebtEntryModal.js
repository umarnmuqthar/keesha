'use client';

import React, { useState } from 'react';
import styles from './AddDebtEntryModal.module.css';
import { addDebtEntry } from '../actions/debtActions';
import { useRouter } from 'next/navigation';

export default function AddDebtEntryModal({ isOpen, onClose, accountId }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState('GIVE'); // GIVE or GOT

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        formData.append('type', type);
        const result = await addDebtEntry(accountId, formData);
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
                    <h2>Add Transaction</h2>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* GIVE / GOT Toggle */}
                    <div className={styles.typeToggle}>
                        <button
                            type="button"
                            className={`${styles.typeBtn} ${type === 'GIVE' ? styles.giveActive : ''}`}
                            onClick={() => setType('GIVE')}
                        >
                            Money I Gave (+)
                        </button>
                        <button
                            type="button"
                            className={`${styles.typeBtn} ${type === 'GOT' ? styles.gotActive : ''}`}
                            onClick={() => setType('GOT')}
                        >
                            Money I Got (-)
                        </button>
                    </div>

                    <div className={styles.group}>
                        <label>Amount (₹)</label>
                        <input name="amount" type="number" step="0.01" placeholder="0.00" required autoFocus />
                    </div>

                    <div className={styles.group}>
                        <label>Description</label>
                        <input name="description" type="text" placeholder="e.g. Dinner bill, Project advance" required />
                    </div>

                    <div className={styles.group}>
                        <label>Date</label>
                        <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>

                    <div className={styles.group}>
                        <label>Reminder Date (Optional)</label>
                        <input name="reminderDate" type="date" />
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Adding...' : 'Add Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
