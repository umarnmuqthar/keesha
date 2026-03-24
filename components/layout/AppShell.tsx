import type { ReactNode } from "react";
import { MobileNav } from "./MobileNav";
import { ShellSearch } from "./ShellSearch";
import styles from "./appShell.module.css";

type AppShellProps = {
  sidebar?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
};

export function AppShell({ sidebar, header, children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      {sidebar ? (
        <aside className={styles.sidebar}>
          <div className={styles.sidebarInner}>{sidebar}</div>
        </aside>
      ) : null}
      <div className={styles.main}>
        {header ? <div className={styles.header}>{header}</div> : null}
        <main className={styles.content}>{children}</main>
        {sidebar ? (
          <div className={styles.mobileNavWrap}>
            <MobileNav />
          </div>
        ) : null}
      </div>
    </div>
  );
}
