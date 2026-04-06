"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, User } from "lucide-react";
import { navItems } from "./navItems";
import styles from "./sidebar.module.css";
import { getUserSession, logoutUser } from "@/app/actions/authActions";

export function Sidebar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>("Loading...");

  useEffect(() => {
    getUserSession().then((session: any) => {
      if (session) {
        setUserName(session.name || session.displayName || "User");
      } else {
        setUserName("Guest");
      }
    });
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.top}>
        <div className={styles.brand}>Keesha</div>
        <nav className={styles.nav}>
          {navItems.map((item: any) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive(item.href) ? styles.active : ""}`}
              >
                <IconComponent size={18} className={styles.navIcon} />
                <span className={styles.navItemLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={styles.bottom}>
        <div className={styles.profile}>
          <User size={18} className={styles.profileIcon} />
          <span className={styles.userName}>{userName}</span>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </div>
  );
}
