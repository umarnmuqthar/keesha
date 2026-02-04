'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { ChevronLeft, ChevronRight, User, LogOut, Menu, X, Home, Repeat2, CalendarClock, Scale, CreditCard, PiggyBank, Wallet, Receipt, Users } from 'lucide-react';
import { logoutAdmin, logoutUser } from '../actions/authActions';

import { useState, useEffect } from 'react';

export default function Sidebar({ isCollapsed, isMobileOpen, toggleSidebar, userProfile, isMounted, onNavigateStart }) {
    const pathname = usePathname();
    const [pendingPath, setPendingPath] = useState(null);

    useEffect(() => {
        setPendingPath(null);
    }, [pathname]);

    const isAdmin = pathname?.startsWith('/admin');

    const iconProps = { size: 18, strokeWidth: 1.7 };

    const navItems = isAdmin ? [
        { name: 'Users', path: '/admin/users', icon: <Users {...iconProps} /> }
    ] : [
        { name: 'Dashboard', path: '/', icon: <Home {...iconProps} /> },
        { name: 'Subscriptions', path: '/subscriptions', icon: <Repeat2 {...iconProps} /> },
        { name: 'EMI Tracker', path: '/loans', icon: <CalendarClock {...iconProps} /> },
        { name: 'Debt Tracker', path: '/debt', icon: <Scale {...iconProps} /> },
        { name: 'Credit Cards', path: '/creditcards', icon: <CreditCard {...iconProps} /> },
        { name: 'Savings', path: '/savings', icon: <PiggyBank {...iconProps} /> },
        { name: 'Incomes', path: '/incomes', icon: <Wallet {...iconProps} /> },
        { name: 'Expenses', path: '/expenses', icon: <Receipt {...iconProps} /> },
    ];

    return (
        <>
            <aside
                className={`${styles.sidebar} ${isAdmin ? styles.adminSidebar : ''} ${(isCollapsed && !isMobileOpen) ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}
                style={{ transition: !isMounted ? 'none' : undefined }}
            >
                <div className={styles.header}>
                    {(!isCollapsed || isMobileOpen) && <h1 className={styles.logoText} style={isAdmin ? { fontSize: '1rem' } : undefined}>{isAdmin ? 'Keesha Admin' : 'Keesha'}</h1>}
                    <button onClick={toggleSidebar} className={styles.toggleBtn}>
                        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => {
                        let isActive = pathname === item.path;

                        // Handle internal/detail pages
                        if (item.path === '/subscriptions' && pathname.startsWith('/subscriptions')) isActive = true;
                        if (item.path === '/loans' && pathname.startsWith('/loans')) isActive = true;
                        if (item.path === '/debt' && pathname.startsWith('/debt')) isActive = true;
                        if (item.path === '/creditcards' && pathname.startsWith('/creditcards')) isActive = true;

                        const isPending = pendingPath === item.path;

                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => {
                                    if (item.path !== pathname) {
                                        setPendingPath(item.path);
                                        if (onNavigateStart) onNavigateStart(item.path);
                                    }
                                }}
                                className={`${styles.navItem} ${isActive ? styles.active : ''} ${isPending ? 'sidebar-item-pending' : ''}`}
                                title={isCollapsed && !isMobileOpen ? item.name : ''}
                            >
                                <span className={styles.iconWrap}>{item.icon}</span>
                                {(!isCollapsed || isMobileOpen) && <span className={styles.label}>{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.footer}>
                    {isAdmin ? (
                        <button
                            onClick={() => logoutAdmin()}
                            className={`${styles.profileSection} w-full text-left`}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                        >
                            <div className={styles.avatar} style={{ background: '#fee2e2', color: '#ef4444' }}>
                                <LogOut size={18} />
                            </div>
                            {!isCollapsed || isMobileOpen ? (
                                <div className={styles.profileInfo}>
                                    <p className={styles.profileName} style={{ color: '#ef4444' }}>Logout</p>
                                </div>
                            ) : null}
                        </button>
                    ) : (
                        // Hide profile section on mobile since it's in the header
                        !isMobileOpen && (
                            <Link
                                href="/profile"
                                className={`${styles.profileSection} ${pathname === '/profile' ? styles.activeProfile : ''}`}
                            >
                                <div className={styles.avatar}>
                                    {userProfile?.image ? (
                                        <img src={userProfile.image} alt="Profile" />
                                    ) : (
                                        <User size={18} color="var(--text-secondary)" />
                                    )}
                                </div>
                                {!isCollapsed || isMobileOpen ? (
                                    <div className={styles.profileInfo}>
                                        <p className={styles.profileName}>{userProfile?.name || 'User'}</p>
                                        <p className={styles.profileEmail}>View Profile</p>
                                    </div>
                                ) : null}
                            </Link>
                        )
                    )}
                </div>
            </aside>
        </>
    );
}
