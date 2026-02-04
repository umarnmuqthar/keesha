'use client';

import React from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import ActionButton from './ui/ActionButton/ActionButton';
import styles from './PageHeaderActions.module.css';

export default function PageHeaderActions({
    title,
    subtitle,
    backPath,
    backLabel,
    variant,
    searchQuery,
    onSearchChange,
    searchPlaceholder = "Search...",
    tabs = [],
    activeTab,
    onTabChange,
    actionLabel,
    onAction,
    actionIcon,
    trailingActions
}) {
    const hasBottomActions = onSearchChange || (tabs && tabs.length > 0) || trailingActions;

    return (
        <div className={`${styles.container} ${variant === 'hero' ? styles.hero : ''}`}>
            <div className={`${styles.headerTitleSection} ${!hasBottomActions ? styles.noBottomMargin : ''}`}>
                <div className={styles.titleRow}>
                    <div className={styles.titleContent}>
                        {backPath && (
                            <Link href={backPath} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                color: 'var(--primary)',
                                fontSize: '1rem',
                                fontWeight: '500',
                                textDecoration: 'none',
                                marginBottom: '0.5rem',
                                transition: 'opacity 0.2s'
                            }}
                                onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
                                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                            >
                                <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>‹</span> {backLabel || 'Back'}
                            </Link>
                        )}
                        <h1 className={styles.title}>{title}</h1>
                    </div>
                    {actionLabel && onAction && (
                        <ActionButton
                            label={actionLabel}
                            onClick={onAction}
                            icon={actionIcon}
                        />
                    )}
                </div>
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>

            {hasBottomActions && (
                <div className={styles.actionsBar}>
                    <div className={styles.searchSection}>
                        {onSearchChange && (
                            <div className={styles.searchWrapper}>
                                <Search size={18} className={styles.searchIcon} />
                                <input
                                    type="text"
                                    placeholder={searchPlaceholder}
                                    className={styles.searchInput}
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div className={styles.rightActions}>
                        {tabs.length > 0 && (
                            <div className={styles.tabs}>
                                {tabs.map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => onTabChange(tab)}
                                        className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ''}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        )}

                        {trailingActions}
                    </div>
                </div>
            )}
        </div>
    );
}
