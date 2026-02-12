import React from 'react';
import styles from './LoadingSkeleton.module.css';

export default function LoadingSkeleton() {
    return (
        <div className={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={styles.card}>
                    <div className={styles.headerPlaceholder}></div>
                    <div className={styles.textPlaceholder}></div>
                    <div className={styles.statsPlaceholder}>
                        <div className={styles.stat}></div>
                        <div className={styles.stat}></div>
                    </div>
                    <div className={styles.shimmer}></div>
                </div>
            ))}
        </div>
    );
}
