'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function ClientLayout({ children, userProfile }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const pathname = usePathname();

    // Auto-close mobile sidebar on route change
    useEffect(() => {
        if (isMobileOpen) {
            setIsMobileOpen(false);
        }
    }, [pathname]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/admin/login';

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileOpen(!isMobileOpen);
        } else {
            setIsCollapsed(!isCollapsed);
        }
    };

    const closeMobileSidebar = () => {
        setIsMobileOpen(false);
    };

    if (isAuthPage) {
        return <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>{children}</div>;
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
            {/* Hamburger for mobile */}
            {!isMobileOpen && (
                <button
                    onClick={toggleSidebar}
                    className="mobile-hamburger-btn"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
            )}

            {/* Backdrop for mobile */}
            {isMobileOpen && (
                <div
                    onClick={closeMobileSidebar}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(2px)',
                        zIndex: 950
                    }}
                />
            )}

            <Sidebar
                isCollapsed={isCollapsed}
                isMobileOpen={isMobileOpen}
                toggleSidebar={toggleSidebar}
                userProfile={userProfile}
                isMounted={isMounted}
            />
            <div
                className={`layout-main ${isCollapsed ? 'layout-collapsed' : ''}`}
                style={!isMounted ? { transition: 'none' } : undefined}
            >
                <div key={pathname} className="page-transition">
                    {children}
                </div>
            </div>
        </div>
    );
}
