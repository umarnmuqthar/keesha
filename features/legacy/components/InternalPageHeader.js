'use client';

import React from 'react';
import Link from 'next/link';
import styles from './InternalPageHeader.module.css';

export default function InternalPageHeader({ backHref, backLabel, actions }) {
    const shortLabel = backLabel ? backLabel.split(' to ')[0] || 'Back' : 'Back';
    return (
        <div className={styles.header}>
            {backHref ? (
                <Link href={backHref} className={styles.backLink}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    <span className={styles.backLabelFull}>{backLabel}</span>
                    <span className={styles.backLabelShort}>{shortLabel}</span>
                </Link>
            ) : <div />}

            <div className={styles.actions}>
                {actions}
            </div>
        </div>
    );
}
