'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { updateCreditCard } from '../actions';
import styles from './AddSubscriptionModal.module.css';

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
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Edit Card</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6b7280' }}>Card Name</label>
                        <input name="name" type="text" defaultValue={card.name} required style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6b7280' }}>Expiry</label>
                        <input name="expiry" type="text" defaultValue={card.expiry} required style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6b7280' }}>Total Limit</label>
                        <input name="totalLimit" type="number" defaultValue={card.totalLimit} required style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6b7280' }}>Statement Balance</label>
                        <input name="statementBalance" type="number" defaultValue={card.statementBalance} required style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6b7280' }}>Due Date</label>
                        <input name="dueDate" type="date" defaultValue={card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : ''} required style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }} />
                    </div>

                    <button type="submit" style={{
                        marginTop: '1rem', padding: '0.875rem', background: 'var(--primary)', color: 'white',
                        border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer'
                    }}>Update Card</button>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
