'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, User, LogOut, Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import { logout } from '../actions/authActions';

export default function ClientLayout({ children, userProfile }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const pathname = usePathname();
    const profilePopupRef = useRef(null);
    const prevPathname = useRef(pathname);

    // Auto-close mobile sidebar and profile popup on route change
    useEffect(() => {
        if (isMobileOpen) {
            setIsMobileOpen(false);
        }
        if (isProfilePopupOpen) {
            setIsProfilePopupOpen(false);
        }

        // Stop loading bar when pathname changes
        if (pathname !== prevPathname.current) {
            setIsNavigating(false);
            prevPathname.current = pathname;
        }
    }, [pathname]);

    const handleNavigateStart = (path) => {
        if (path !== pathname) {
            setIsNavigating(true);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profilePopupRef.current && !profilePopupRef.current.contains(event.target)) {
                setIsProfilePopupOpen(false);
            }
        };

        if (isProfilePopupOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfilePopupOpen]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const isAuthPage =
        pathname === '/login' ||
        pathname === '/signup' ||
        pathname === '/forgot-password' ||
        pathname === '/reset-password' ||
        pathname === '/admin/login';
    const isLoanDetailPage = pathname?.startsWith('/loans/');
    const isAdminUsersPage = pathname === '/admin/users';

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

                    <div style={{ marginLeft: 'auto', position: 'relative' }} ref={profilePopupRef}>
                        <button
                            onClick={() => setIsProfilePopupOpen(!isProfilePopupOpen)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                backgroundColor: '#f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${isProfilePopupOpen ? 'var(--primary)' : 'var(--border)'}`,
                                transition: 'all 0.2s'
                            }}>
                                {userProfile?.image ? (
                                    <img
                                        src={userProfile.image}
                                        alt="Profile"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <User size={20} color={isProfilePopupOpen ? 'var(--primary)' : 'var(--text-secondary)'} />
                                )}
                            </div>
                        </button>

                        {isProfilePopupOpen && (
                            <div className="mobile-profile-popup">
                                    <Link
                                        href="/profile"
                                    className="mobile-profile-details"
                                    onClick={() => setIsProfilePopupOpen(false)}
                                >
                                    <div className="mobile-profile-avatar">
                                        {userProfile?.image ? (
                                            <img src={userProfile.image} alt="Profile" />
                                        ) : (
                                            <User size={16} color="var(--text-secondary)" />
                                        )}
                                    </div>
                                    <div className="mobile-profile-info">
                                        <p className="mobile-profile-name">{userProfile?.name || 'User'}</p>
                                        <p className="mobile-profile-email">{userProfile?.email || 'View Profile'}</p>
                                    </div>
                                </Link>
                                <button
                                    onClick={() => logout()}
                                    className="mobile-profile-logout"
                                >
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
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

            {isNavigating && (
                <div className="loading-bar-container">
                    <div className="loading-bar active" />
                </div>
            )}

            <Sidebar
                isCollapsed={isCollapsed}
                isMobileOpen={isMobileOpen}
                toggleSidebar={toggleSidebar}
                userProfile={userProfile}
                isMounted={isMounted}
                onNavigateStart={handleNavigateStart}
            />
            <div
                className={`layout-main ${isCollapsed ? 'layout-collapsed' : ''} ${isLoanDetailPage || isAdminUsersPage ? 'layout-no-padding' : ''}`}
                style={!isMounted ? { transition: 'none' } : undefined}
            >
                <div>
                    {children}
                </div>
            </div>
        </div>
    );
}
