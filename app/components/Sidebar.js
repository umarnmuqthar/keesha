'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { ChevronLeft, ChevronRight, User, LogOut, Menu, X } from 'lucide-react';
import { logout } from '../actions/authActions';

export default function Sidebar({ isCollapsed, isMobileOpen, toggleSidebar, userProfile, isMounted }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    const navItems = isAdmin ? [
        { name: 'Users', path: '/admin/users', icon: '👥' }
    ] : [
        { name: 'Dashboard', path: '/', icon: '🏠' },
        { name: 'Subscriptions', path: '/subscriptions', icon: '🔁' },
        { name: 'EMI Tracker', path: '/loans', icon: '🗓️' },
        { name: 'Debt Tracker', path: '/debt', icon: '📉' },
        { name: 'Credit Cards', path: '/creditcards', icon: '💳' },
        { name: 'Savings', path: '/savings', icon: '💰' },
        { name: 'Incomes', path: '/incomes', icon: '💸' },
        { name: 'Expenses', path: '/expenses', icon: '🧾' },
    ];

    return (
        <>
            <aside
                className={`${styles.sidebar} ${(isCollapsed && !isMobileOpen) ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}
                style={{ transition: !isMounted ? 'none' : undefined }}
            >
                <div className={styles.header}>
                    {(!isCollapsed || isMobileOpen) && <h1 className={styles.logoText}>{isAdmin ? 'Keesha Admin' : 'Keesha'}</h1>}
                    <button onClick={toggleSidebar} className={styles.toggleBtn}>
                        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.path || (item.path === '/subscriptions' && pathname.startsWith('/subscription'));
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                title={isCollapsed && !isMobileOpen ? item.name : ''}
                            >
                                <span className={styles.icon}>{item.icon}</span>
                                {(!isCollapsed || isMobileOpen) && <span className={styles.label}>{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.footer}>
                    {isAdmin ? (
                        <button
                            onClick={() => logout()}
                            className={`${styles.profileSection} w-full text-left`}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                        >
                            <div className={styles.avatar} style={{ background: '#fee2e2', color: '#ef4444' }}>
                                <LogOut size={18} />
                            </div>
                            {!isCollapsed || isMobileOpen ? (
                                <div className={styles.profileInfo}>
                                    <p className={styles.profileName} style={{ color: '#ef4444' }}>Logout</p>
                                    <p className={styles.profileEmail}>Sign out of Admin</p>
                                </div>
                            ) : null}
                        </button>
                    ) : (
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
                    )}
                </div>
            </aside>
        </>
    );
}
