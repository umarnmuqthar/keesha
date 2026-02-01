import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function PageHeader({ title, subtitle, actionLabel, onAction, backPath, backLabel, trailingActions }) {
    return (
        <div style={{
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '1rem',
            flexWrap: 'wrap'
        }}>
            <div>
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
                <h1 className="page-header-title" style={{
                    fontWeight: '800',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.03em',
                    margin: 0
                }}>{title}</h1>
                {subtitle && (
                    <p className="page-header-subtitle" style={{
                        color: 'var(--text-secondary)',
                        fontWeight: '500',
                        margin: '4px 0 0 0',
                        letterSpacing: '-0.01em'
                    }}>{subtitle}</p>
                )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '4px' }}>
                {trailingActions}

                {actionLabel && onAction && (
                    <button
                        onClick={onAction}
                        className="action-btn"
                    >
                        <Plus size={20} />
                        <span className="btn-label">{actionLabel}</span>
                    </button>
                )}
            </div>
        </div>
    );
}
