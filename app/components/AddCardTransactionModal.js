'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { addCardTransaction } from '../actions';
import styles from './AddCardTransactionModal.module.css';

export default function AddCardTransactionModal({ isOpen, onClose, cardId }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [type, setType] = useState('Expense');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.target);
        formData.append('type', type);

        const result = await addCardTransaction(cardId, formData);
        setIsSubmitting(false);

        if (result.success) {
            onClose();
        } else {
            alert(result.message);
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Log Transaction</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <div className={styles.typeToggle}>
                    <button
                        type="button"
                        onClick={() => setType('Expense')}
                        className={`${styles.typeBtn} ${type === 'Expense' ? styles.expenseActive : ''}`}
                    >
                        <ArrowUpRight size={16} /> Expense
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('Payment')}
                        className={`${styles.typeBtn} ${type === 'Payment' ? styles.paymentActive : ''}`}
                    >
                        <ArrowDownRight size={16} /> Payment
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Amount</label>
                        <input name="amount" type="number" step="0.01" required placeholder="0.00" autoFocus />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <input name="description" type="text" placeholder="e.g. Flight Ticket" />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Date</label>
                        <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button disabled={isSubmitting} type="submit" className={styles.submitBtn}>
                            {isSubmitting ? 'Logging...' : 'Confirm Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
