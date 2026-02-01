'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, User, LogOut, Menu, X } from 'lucide-react';
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
            {/* Mobile Header */}
            {!isMobileOpen && (
                <div className="mobile-header">
                    <button
                        onClick={toggleSidebar}
                        className="mobile-hamburger-btn"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                    <span className="mobile-logo-text">Keesha</span>

                    <Link href="/profile" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            backgroundColor: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border)'
                        }}>
                            {userProfile?.image ? (
                                <img
                                    src={userProfile.image}
                                    alt="Profile"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <User size={20} color="var(--text-secondary)" />
                            )}
                        </div>
                    </Link>
                </div>
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
