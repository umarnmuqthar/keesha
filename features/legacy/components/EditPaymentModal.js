'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './AddLoanModal.module.css'; // Reusing modal styles

export default function EditPaymentModal({ isOpen, onClose, onSave, initialData }) {
    const [formData, setFormData] = useState({
        amount: '',
        date: '',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                amount: initialData.amount || '',
                date: initialData.date || '',
                description: initialData.description || ''
            });
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Save Payment Error:', error);
            alert('Failed to save changes.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className={styles.overlay} onClick={onClose} style={{ zIndex: 10000 }}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <div className={styles.header}>
                    <h2>Edit Payment</h2>
                </div>

                <form className={styles.form} onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                    <div className={styles.formGroup}>
                        <label>Amount (₹)</label>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                            placeholder="0"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Date</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Description (Optional)</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Add a note..."
                            style={{ width: '100%', minHeight: '80px', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #e5e7eb' }}
                        />
                    </div>

                    <div className={styles.actions} style={{ marginTop: '2rem' }}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
