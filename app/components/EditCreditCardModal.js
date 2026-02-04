'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { updateCreditCard } from '../actions';
import styles from './EditCreditCardModal.module.css';

export default function EditCreditCardModal({ isOpen, onClose, card }) {
    if (!isOpen || !card) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const result = await updateCreditCard(card.id, formData);
        if (result.success) {
            onClose();
        } else {
            alert(result.message);
        }
    };

    const modalContent = (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Edit Card</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Card Name</label>
                        <input name="name" type="text" defaultValue={card.name} required />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Expiry</label>
                        <input name="expiry" type="text" defaultValue={card.expiry} required />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Total Limit</label>
                        <input name="totalLimit" type="number" defaultValue={card.totalLimit} required />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Statement Balance</label>
                        <input name="statementBalance" type="number" defaultValue={card.statementBalance} required />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Due Date</label>
                        <input name="dueDate" type="date" defaultValue={card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : ''} required />
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" className={styles.submitBtn}>Update Card</button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
