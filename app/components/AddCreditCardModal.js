'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, X } from 'lucide-react';
import { addCreditCard } from '../actions';
import styles from './AddCreditCardModal.module.css';

const BRANDS = {
    VISA: { name: 'Visa', color: '#1a1f71', pattern: /^4/ },
    MASTERCARD: { name: 'Mastercard', color: '#eb001b', pattern: /^(5[1-5]|2[2-7])/ },
    RUPAY: { name: 'RuPay', color: '#0055a4', pattern: /^6(0|5|8)/ },
    AMEX: { name: 'Amex', color: '#27a597', pattern: /^3(4|7)/ },
    UNKNOWN: { name: 'Card', color: '#374151', pattern: null }
};

export default function AddCreditCardModal({ isOpen, onClose }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [detectedBrand, setDetectedBrand] = useState(BRANDS.UNKNOWN);

    useEffect(() => {
        // Brand Detection Logic
        const cleanNumber = cardNumber.replace(/\s+/g, '');
        let brandFound = BRANDS.UNKNOWN;

        for (const [key, brand] of Object.entries(BRANDS)) {
            if (brand.pattern && brand.pattern.test(cleanNumber)) {
                brandFound = brand;
                break;
            }
        }
        setDetectedBrand(brandFound);
    }, [cardNumber]);

    const handleNumberChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 16);
        const parts = value.match(/.{1,4}/g) || [];
        setCardNumber(parts.join(' '));
    };

    const handleExpiryChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) value = value.substring(0, 4);
        if (value.length > 2) {
            setExpiry(value.substring(0, 2) + '/' + value.substring(2));
        } else {
            setExpiry(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.target);
        formData.append('brand', detectedBrand.name);

        const result = await addCreditCard(formData);
        setIsSubmitting(false);

        if (result.success) {
            onClose();
            setCardName('');
            setCardNumber('');
            setExpiry('');
        } else {
            alert(result.message);
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Add Credit Card</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <div className={styles.previewSection}>
                    <div
                        className={styles.cardPreview}
                        style={{ backgroundColor: detectedBrand.color }}
                    >
                        <div className={styles.cardBrand}>
                            <span style={{ fontWeight: 800, fontSize: '0.875rem' }}>{detectedBrand.name}</span>
                        </div>
                        <div className={styles.chip} />
                        <div className={styles.cardNumberPreview}>
                            {cardNumber || '•••• •••• •••• ••••'}
                        </div>
                        <div className={styles.cardFooter}>
                            <div>
                                <div className={styles.cardLabel}>Card Holder</div>
                                <div className={styles.cardValue}>{cardName || 'YOUR NAME'}</div>
                            </div>
                            <div>
                                <div className={styles.cardLabel}>Expires</div>
                                <div className={styles.cardValue}>{expiry || 'MM/YY'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Card Name</label>
                        <input
                            name="name"
                            type="text"
                            placeholder="e.g. ICICI Coral"
                            required
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Card Number</label>
                        <input
                            name="number"
                            type="text"
                            placeholder="0000 0000 0000 0000"
                            required
                            value={cardNumber}
                            onChange={handleNumberChange}
                        />
                    </div>
                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Expiry Date</label>
                            <input
                                name="expiry"
                                type="text"
                                placeholder="MM/YY"
                                required
                                value={expiry}
                                onChange={handleExpiryChange}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Card Limit</label>
                            <input name="totalLimit" type="number" placeholder="0.00" required />
                        </div>
                    </div>
                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Statement Balance</label>
                            <input name="statementBalance" type="number" placeholder="Current due" required />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Next Due Date</label>
                            <input name="dueDate" type="date" required />
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                            {isSubmitting ? 'Adding...' : 'Add Card'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
