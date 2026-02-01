'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { addCardTransaction } from '../actions';
import styles from './AddSubscriptionModal.module.css'; // Reusing similar modal styles

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
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={onClose}>
            <div style={{
                background: 'white', width: '100%', maxWidth: '400px', borderRadius: '24px',
                padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Log Transaction</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => setType('Expense')}
                        style={{
                            padding: '0.75rem', borderRadius: '12px', border: '1px solid',
                            borderColor: type === 'Expense' ? 'var(--danger)' : 'var(--border)',
                            background: type === 'Expense' ? '#fee2e2' : 'white',
                            color: type === 'Expense' ? 'var(--danger)' : 'var(--text-secondary)',
                            fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
                        }}
                    >
                        <ArrowUpRight size={16} /> Expense
                    </button>
                    <button
                        onClick={() => setType('Payment')}
                        style={{
                            padding: '0.75rem', borderRadius: '12px', border: '1px solid',
                            borderColor: type === 'Payment' ? 'var(--success)' : 'var(--border)',
                            background: type === 'Payment' ? '#dcfce7' : 'white',
                            color: type === 'Payment' ? 'var(--success)' : 'var(--text-secondary)',
                            fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
                        }}
                    >
                        <ArrowDownRight size={16} /> Payment
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6b7280' }}>Amount</label>
                        <input name="amount" type="number" step="0.01" required placeholder="0.00" autoFocus style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6b7280' }}>Description</label>
                        <input name="description" type="text" placeholder="e.g. Flight Ticket" style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6b7280' }}>Date</label>
                        <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }} />
                    </div>

                    <button disabled={isSubmitting} type="submit" style={{
                        marginTop: '1rem', padding: '0.875rem', background: 'var(--primary)', color: 'white',
                        border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer'
                    }}>
                        {isSubmitting ? 'Logging...' : 'Confirm Entry'}
                    </button>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
