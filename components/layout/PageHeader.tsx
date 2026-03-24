import type { ReactNode } from 'react';
import { ShellSearch } from './ShellSearch';
import styles from './pageHeader.module.css';

type PageHeaderProps = {
  /** Large page title */
  title: string;
  /** Small uppercase label above title — omit to hide */
  eyebrow?: string;
  /** Left‑side tabs / toggles (e.g. status filter buttons) */
  tabs?: ReactNode;
  /** Icon buttons placed after tabs (filter, dashboard toggle, etc.) */
  filters?: ReactNode;
  /** Whether to show the search bar in the header */
  showSearch?: boolean;
  /** Right‑side elements: primary action button, avatar, etc. */
  actions?: ReactNode;
};

/**
 * Standard sticky page header used inside AppShell.
 */
export function PageHeader({ title, eyebrow, tabs, filters, showSearch, actions }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.left}>
        {(title || eyebrow) && (
          <div className={styles.titleBlock}>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            {title && <h1 className={styles.title}>{title}</h1>}
          </div>
        )}

        {(tabs || filters) && (
          <div className={styles.tabsRow}>
            {tabs && <div className={styles.tabs}>{tabs}</div>}
            {filters && <div className={styles.filters}>{filters}</div>}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {showSearch && (
          <ShellSearch
            formClassName={styles.searchForm}
            inputClassName={styles.searchInput}
          />
        )}
        {actions}
      </div>
    </div>
  );
}

/** Standardized tab button for use within the 'tabs' prop */
export function TabButton({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: ReactNode 
}) {
  return (
    <button 
      className={`${styles.statusBtn} ${active ? styles.statusBtnActive : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Standardized action button for use within the 'filters' prop (e.g. dashboard toggle) */
export function ActionButton({ 
  active, 
  onClick, 
  title,
  children 
}: { 
  active?: boolean; 
  onClick: () => void; 
  title?: string;
  children: ReactNode 
}) {
  return (
    <button 
      className={`${styles.actionBtn} ${active ? styles.actionBtnActive : ''}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}
