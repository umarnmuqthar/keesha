
import React from 'react';
import styles from './StatusBadge.module.css';

export default function StatusBadge({ status }) {
    const statusLower = (status || '').toLowerCase();

    return (
        <div className={styles.statusPill} data-status={statusLower}>
            <span className={styles.dot}></span> {status}
        </div>
    );
}
