'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './AddLoanModal.module.css';

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    style,
    confirmText = 'Delete Forever',
    confirmColor = 'var(--danger)',
    titleColor = 'var(--danger)',
    children,
    disabled = false
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen) return null;
    if (!mounted || typeof document === 'undefined') return null;

    return createPortal(
        <div className={styles.overlay} onClick={onClose} style={{ zIndex: 10000, position: 'fixed', ...style }}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px', marginTop: '10rem' }}>
                <div className={styles.header} style={{ borderBottom: 'none', paddingBottom: '0.25rem' }}>
                    <h2 style={{ color: titleColor, textAlign: 'left', flex: 'none', fontSize: '1rem' }}>
                        {title || 'Delete Subscription'}
                    </h2>
                </div>

                <div style={{ padding: '0 1.25rem 1.25rem 1.25rem' }}>
                    {children ? children : (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5', margin: '0 0 1.5rem 0' }}>
                            {message}
                        </p>
                    )}

                    <div className={styles.actions} style={{ borderTop: 'none', paddingTop: 0, marginTop: children ? '1.5rem' : 0, gap: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.cancelBtn}
                            disabled={disabled}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className={styles.submitBtn}
                            disabled={disabled}
                            style={{ background: confirmColor, opacity: disabled ? 0.7 : 1 }}
                        >
                            {disabled ? 'Processing...' : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
