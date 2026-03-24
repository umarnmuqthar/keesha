'use client';

import React, { useState, useTransition } from 'react';
import { X, Trash2, Edit, Calendar, Tag, Info, CheckCircle2, Clock } from 'lucide-react';
import { deleteIncomeEntry } from '@/app/actions/incomeActions';
import { Button } from '@/components/ui';
import styles from './incomeDetailsModal.module.css';

interface IncomeEntry {
    id: string;
    amount: number;
    source: string;
    category: string;
    date: string;
    status: string;
    notes?: string;
}

interface IncomeDetailsModalProps {
    income: IncomeEntry | null;
    onClose: () => void;
    onDeleted?: () => void;
}

const formatAmount = (value?: number) => {
    const amount = Number(value || 0);
    return `₹${amount.toLocaleString('en-IN')}`;
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

export default function IncomeDetailsModal({ income, onClose, onDeleted }: IncomeDetailsModalProps) {
    const [isPending, startTransition] = useTransition();

    if (!income) return null;

    const handleDelete = () => {
        if (!confirm('Are you sure you want to delete this income entry?')) return;

        startTransition(async () => {
            const result = await deleteIncomeEntry(income.id);
            if (result.success) {
                if (onDeleted) onDeleted();
                onClose();
            } else {
                alert('Failed to delete entry');
            }
        });
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.titleArea}>
                        <div className={styles.avatar}>
                            {income.source.charAt(0)}
                        </div>
                        <div>
                            <h2>{income.source}</h2>
                            <div className={styles.statusInfo}>
                                {income.status === 'Received' ? (
                                    <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <CheckCircle2 size={12} /> Received
                                    </span>
                                ) : (
                                    <span style={{ color: '#ca8a04', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={12} /> Pending
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.amountSection}>
                    <p className={styles.amountLabel}>Total amount</p>
                    <h1 className={styles.amountValue}>{formatAmount(income.amount)}</h1>
                </div>

                <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}><Calendar size={12} /> Date</span>
                        <span className={styles.detailValue}>{formatDate(income.date)}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}><Tag size={12} /> Category</span>
                        <span className={styles.detailValue}>{income.category}</span>
                    </div>
                </div>

                {income.notes && (
                    <div className={styles.notesSection}>
                        <span className={styles.detailLabel}><Info size={12} /> Notes</span>
                        <div className={styles.notesBox}>
                            {income.notes}
                        </div>
                    </div>
                )}

                <div className={styles.footer}>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleDelete} 
                        disabled={isPending}
                        className={styles.deleteBtn}
                    >
                        <Trash2 size={16} /> Delete Entry
                    </Button>
                    {/* Edit button placeholder - for future implementation */}
                    {/* <Button variant="secondary" size="sm" className={styles.editBtn}>
                        <Edit size={16} /> Edit
                    </Button> */}
                </div>
            </div>
        </div>
    );
}
