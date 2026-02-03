'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import styles from './ActionButton.module.css';

export default function ActionButton({ label, onClick, icon: Icon = Plus, variant = 'primary' }) {
    return (
        <button
            onClick={onClick}
            className={`${styles.button} ${styles[variant]}`}
        >
            <Icon size={18} />
            <span className={styles.label}>{label}</span>
        </button>
    );
}
