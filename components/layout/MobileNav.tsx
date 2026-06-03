'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut } from 'lucide-react';
import { navItems } from './navItems';
import { logoutUser } from '@/app/actions/authActions';
import styles from './mobileNav.module.css';

export function MobileNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Close the sheet when path changes
  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const primaryHrefs = ['/', '/expenses', '/debt', '/loans'];
  
  const primaryItems = navItems.filter((item) => primaryHrefs.includes(item.href));
  const secondaryItems = navItems.filter((item) => !primaryHrefs.includes(item.href));
  
  // More tab is active if current path is a secondary page
  const isMoreActive = secondaryItems.some((item) => isActive(item.href));

  const handleLogout = async () => {
    setIsMoreOpen(false);
    await logoutUser();
  };

  return (
    <>
      <nav className={styles.nav} aria-label="Mobile navigation">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.item} ${active ? styles.itemActive : ''}`}
            >
              <div className={styles.icon}>
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              </div>
              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={() => setIsMoreOpen(true)}
          className={`${styles.item} ${isMoreActive ? styles.itemActive : ''}`}
        >
          <div className={styles.icon}>
            <Menu size={20} strokeWidth={isMoreActive ? 2.2 : 1.8} />
          </div>
          <span className={styles.label}>More</span>
        </button>
      </nav>

      {isMoreOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsMoreOpen(false)} />
          <div className={styles.drawer}>
            <div className={styles.grabber} />
            <div className={styles.drawerHeader}>
              <h2 className={styles.drawerTitle}>More Options</h2>
              <button className={styles.closeBtn} onClick={() => setIsMoreOpen(false)} aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            
            <div className={styles.drawerList}>
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.drawerItem} ${active ? styles.drawerItemActive : ''}`}
                  >
                    <div className={styles.drawerItemLeft}>
                      <Icon size={18} className={styles.drawerIcon} strokeWidth={active ? 2.2 : 1.8} />
                      <span className={styles.drawerLabel}>{item.label}</span>
                    </div>
                  </Link>
                );
              })}

              <button
                onClick={handleLogout}
                className={`${styles.drawerItem} ${styles.logoutBtn}`}
              >
                <div className={styles.drawerItemLeft}>
                  <LogOut size={18} />
                  <span className={styles.drawerLabel}>Logout</span>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
