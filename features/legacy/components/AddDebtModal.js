'use client';

import React, { useState, useEffect } from 'react';
import styles from './AddDebtModal.module.css';
import { addDebtAccount, checkDebtAccountExists } from '@/app/actions/debtActions';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export default function AddDebtModal({ isOpen, onClose, onAccountAdded, accounts = [] }) {
    const router = useRouter();
    const [name, setName] = useState('');
    const [nameExists, setNameExists] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const trimmed = name.trim().toLowerCase();
        if (!trimmed) {
            setNameExists(false);
            setIsValidating(false);
            return;
        }

        // Check against existing accounts prop (Instant & Case-Insensitive)
        const localMatch = accounts.some(acc => (acc.name || '').toLowerCase() === trimmed);
        if (localMatch) {
            setNameExists(true);
            setIsValidating(false);
            return;
        }

        // Optional: Also check server if not found locally (e.g. if list is paginated in future)
        const timer = setTimeout(async () => {
            setIsValidating(true);
            const exists = await checkDebtAccountExists(name);
            setNameExists(exists);
            setIsValidating(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [name, accounts]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (nameExists || isValidating) return;
        
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await addDebtAccount(formData);
        if (result.success) {
            router.refresh();
            if (onAccountAdded) onAccountAdded(result.account);
            setName('');
            onClose();
        } else {
            alert(result.message || 'Something went wrong');
        }
        setLoading(false);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>New Debt Account</h2>
                    <button onClick={onClose} className={styles.closeBtn} aria-label="Close modal">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.group}>
                        <label>Person / Entity Name</label>
                        <input 
                            name="name" 
                            type="text" 
                            placeholder="e.g. Arjun Nair, Priya Thomas, Khan Traders" 
                            required 
                            autoFocus 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        {isValidating && <span className={styles.validating}>Checking availability...</span>}
                        {nameExists && <span className={styles.error}>Account already exists</span>}
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
                        <button 
                            type="submit" 
                            className={styles.submitBtn} 
                            disabled={loading || nameExists || isValidating || !name.trim()}
                        >
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
