"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./navItems";
import styles from "./sidebar.module.css";

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.top}>
        <div className={styles.brand}>Keesha</div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href) ? styles.active : ""}`}
            >
              <span className={styles.navItemLabel}>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
