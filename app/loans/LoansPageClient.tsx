'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition, useEffect, useRef } from 'react';
import { markLoanPaidWithAmount } from '@/app/actions/loanActions';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { useShellSearch } from '@/components/layout/ShellSearchContext';
import { AddButton, Button, Card, Input } from '@/components/ui';
import { useModalState } from '@/components/ui/useModalState';
import AddLoanModal from '@/features/legacy/components/AddLoanModal';
import { Filter } from 'lucide-react';
import { ShellSearch } from '@/components/layout/ShellSearch';
import shellStyles from '../app-shell.module.css';
import appShellStyles from '@/components/layout/appShell.module.css';
import styles from './loans.module.css';

type Loan = {
  id: string;
  name?: string;
  lender?: string;
  type?: string;
  loanType?: string;
  status?: string;
  emiDay?: number;
  dueDate?: number;
  emiAmount?: number;
  monthlyEmi?: number;
  amount?: number;
  totalPayable?: number;
  outstandingAmount?: number;
  remainingAmount?: number;
  paymentStatus?: 'Paid' | 'Due soon' | 'Overdue';
  isOverdue?: boolean;
  dueHint?: string;
  nextDueDate?: string;
  nextDueAmount?: number;
  paidAmount?: number;
  outstandingBalance?: number;
};

type LoanMetrics = {
  activeLoans: number;
  closingInThreeMonths: number;
  totalPrincipal: number;
  totalPayable: number;
  totalOutstanding: number;
  lifetimeDebtRepaid: number;
  outstandingPercent: number;
  monthlyEmiDue: number;
  monthlyEmiPaid: number;
  monthlyEmiRemaining: number;
  paidInstallments: number;
  totalInstallments: number;
  salaryImpactPercent: number | null;
  monthlyIncome: number | null;
};

type LoansPageClientProps = {
  loans: Loan[];
  metrics: LoanMetrics;
};

const formatAmount = (value?: number) => {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString('en-IN')}`;
};

const formatDate = (raw?: string) => {
  if (!raw) return "—";
  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const getDueTimestamp = (loan: Loan) => {
  if (!loan.nextDueDate) return Number.POSITIVE_INFINITY;
  const timestamp = new Date(`${loan.nextDueDate}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
};

type SelectedPayment = {
  loanId: string;
  loanName: string;
  nextDueDate: string;
  defaultAmount: number;
} | null;

function MarkPaidButton({
  loan,
  onSelect
}: {
  loan: Loan;
  onSelect: (p: NonNullable<SelectedPayment>) => void;
}) {
  if (!loan.nextDueDate) return null;

  const dateObj = new Date(`${loan.nextDueDate}T00:00:00`);
  const monthStr = !Number.isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-GB', { month: 'short' })
    : '';

  const emiAmount = Number(loan.nextDueAmount || loan.emiAmount || loan.monthlyEmi || loan.amount || 0);

  return (
    <button
      className={styles.markPaidBtn}
      onClick={() => onSelect({
        loanId: loan.id,
        loanName: loan.name || 'Loan',
        nextDueDate: loan.nextDueDate!,
        defaultAmount: emiAmount
      })}
    >
      Mark paid ({monthStr})
    </button>
  );
}

function MarkPaidModal({
  selected,
  onClose
}: {
  selected: SelectedPayment;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (selected) {
      setAmount(selected.defaultAmount.toString());
    }
  }, [selected]);

  if (!selected) return null;

  const monthStr = new Date(`${selected.nextDueDate}T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    startTransition(async () => {
      await markLoanPaidWithAmount(selected.loanId, selected.nextDueDate, amount);
      onClose();
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <Card className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Confirm Payment</h3>
          <p>Mark payment for <strong>{selected.loanName}</strong> ({monthStr})</p>
        </div>

        <form onSubmit={handleConfirm} className={styles.modalBody}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Payment Amount (₹)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              min="0"
              step="any"
              disabled={isPending}
              autoFocus
            />
          </div>

          <div className={styles.modalActions}>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Confirm Payment'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function LoansPageClient({ loans, metrics }: LoansPageClientProps) {
  const modal = useModalState(false);
  const [selectedPayment, setSelectedPayment] = useState<SelectedPayment>(null);
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Closed' | 'All'>('Active');
  const [timingFilter, setTimingFilter] = useState<'All' | 'Pending this Month' | 'Upcoming this Month' | 'Upcoming Next Month'>('All');
  const [isTimingDropdownOpen, setIsTimingDropdownOpen] = useState(false);
  const timingDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        timingDropdownRef.current &&
        !timingDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTimingDropdownOpen(false);
      }
    };

    if (isTimingDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTimingDropdownOpen]);

  const { query: searchQuery } = useShellSearch();
  const query = searchQuery.trim().toLowerCase();
  const monthShort = new Date().toLocaleDateString('en-GB', { month: 'short' });

  const filteredLoans = useMemo(() => {
    let base = loans;

    if (statusFilter === 'Active') {
      base = base.filter(loan => String(loan.status || "Active").toLowerCase() !== "closed");
    } else if (statusFilter === 'Closed') {
      base = base.filter(loan => String(loan.status || "Active").toLowerCase() === "closed");
    }

    if (timingFilter !== 'All') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      base = base.filter(loan => {
        if (!loan.nextDueDate) return false;
        const due = new Date(`${loan.nextDueDate}T00:00:00`);
        if (isNaN(due.getTime())) return false;

        const isCurrentMonth = due.getMonth() === currentMonth && due.getFullYear() === currentYear;
        const isNextMonth = due.getMonth() === (currentMonth + 1) % 12 &&
          due.getFullYear() === (currentMonth === 11 ? currentYear + 1 : currentYear);

        if (timingFilter === 'Pending this Month') {
          return loan.isOverdue || (isCurrentMonth && due < now);
        }
        if (timingFilter === 'Upcoming this Month') {
          return isCurrentMonth && !loan.isOverdue && due >= now;
        }
        if (timingFilter === 'Upcoming Next Month') {
          return isNextMonth;
        }
        return false;
      });
    }

    if (query) {
      base = base.filter((loan) =>
        [loan.name, loan.lender, loan.type]
          .map((value) => String(value || '').toLowerCase())
          .some((value) => value.includes(query))
      );
    }

    return [...base].sort((a, b) => {
      const dueDelta = getDueTimestamp(a) - getDueTimestamp(b);
      if (dueDelta !== 0) return dueDelta;
      return String(a.name || '').localeCompare(String(b.name || ''), 'en');
    });
  }, [loans, query, statusFilter, timingFilter]);

  const existingNames = loans.map((loan) => loan.name || '').filter(Boolean);

  return (
    <>
      <AppShell
        sidebar={<Sidebar />}
        showSearch={false}
        header={
          <div className={shellStyles.header}>
            <div>
              <p className={shellStyles.eyebrow}>Loans</p>
              <h1>
                <span className={shellStyles.desktopTitle}>Debt commitments</span>
              </h1>
            </div>
            <div className={shellStyles.headerActions}>
              <AddButton size="sm" onClick={modal.open}>Add loan</AddButton>
            </div>
          </div>
        }
      >
        <div className={styles.page}>
          <div className={styles.filtersRow}>
            <div className={styles.leftFilters}>
              <div className={styles.statusToggle}>
                {(['Active', 'Closed', 'All'] as const).map(status => (
                  <button
                    key={status}
                    className={`${styles.statusBtn} ${statusFilter === status ? styles.statusBtnActive : ''}`}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className={styles.funnelWrap} ref={timingDropdownRef}>
                <button
                  className={`${styles.funnelBtn} ${timingFilter !== 'All' ? styles.funnelBtnActive : ''}`}
                  onClick={() => setIsTimingDropdownOpen(!isTimingDropdownOpen)}
                >
                  <Filter size={16} />
                </button>
                {isTimingDropdownOpen && (
                  <div className={styles.funnelDropdown}>
                    {(['All', 'Pending this Month', 'Upcoming this Month', 'Upcoming Next Month'] as const).map(filter => (
                      <button
                        key={filter}
                        className={`${styles.dropdownItem} ${timingFilter === filter ? styles.dropdownItemActive : ''}`}
                        onClick={() => {
                          setTimingFilter(filter);
                          setIsTimingDropdownOpen(false);
                        }}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <ShellSearch
              formClassName={styles.searchForm}
              inputClassName={styles.searchInput}
            />
          </div>

          <section className={styles.hero}>
            <div className={styles.heroStats}>
              <Card className={styles.statCard}>
                <p className={styles.label}>Active Loans</p>
                <h3>{metrics.activeLoans}</h3>
              </Card>
              <Card className={styles.statCard}>
                <p className={styles.label}>Total Outstanding</p>
                <h3>{formatAmount(metrics.totalOutstanding)}</h3>
              </Card>
              <Card className={styles.statCard}>
                <p className={styles.label}>Remaining EMI ({monthShort})</p>
                <h3>{formatAmount(metrics.monthlyEmiRemaining)}</h3>
              </Card>
            </div>
          </section>

          <section className={styles.list}>
            {filteredLoans.length === 0 ? (
              <Card className={styles.empty}>
                <h3>{query ? 'No matching loans' : 'No loans yet'}</h3>
                <p>
                  {query
                    ? `No loan found for "${searchQuery}".`
                    : 'Add a loan to start tracking monthly repayments.'}
                </p>
                {!query ? <AddButton size="sm" onClick={modal.open}>Add loan</AddButton> : null}
              </Card>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Loan Name</th>
                      <th>Next Due</th>
                      <th>Outstanding</th>
                      <th>Total Loan</th>
                      <th>Progress</th>
                      <th>Monthly EMI</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoans.map((loan) => {
                      const paidAmount = Number(loan.paidAmount || 0);
                      const totalAmount = Number(loan.totalPayable || loan.amount || 0);
                      const emiAmount = Number(loan.nextDueAmount || loan.emiAmount || loan.monthlyEmi || loan.amount || 0);
                      const outstandingAmount = Number(loan.outstandingBalance || loan.remainingAmount || 0);
                      const remainingBalance = Math.max(0, totalAmount - paidAmount);
                      const progress = Math.max(
                        0,
                        Math.min(
                          (paidAmount / Math.max(totalAmount, 1)) * 100,
                          100
                        )
                      );

                      return (
                        <tr key={loan.id} className={styles.tableRow}>
                          <td className={styles.loanNameCell}>
                            <Link href={`/loans/${loan.id}`} className={styles.loanLink}>
                              <strong>{loan.name || 'Loan'}</strong>
                              <span className={styles.typeSubtext}>
                                {loan.loanType === 'Consumer' ? 'Consumer' : 'Personal'}
                                {loan.lender ? ` • ${loan.lender}` : ''}
                              </span>
                            </Link>
                          </td>
                          <td>
                            <div className={styles.dueCell}>
                              <span className={styles.dueDateText}>{formatDate(loan.nextDueDate)}</span>
                              {loan.dueHint ? (
                                <span className={`${styles.dueHintSmall} ${loan.isOverdue ? styles.dueHintDanger : styles.dueHintSoon}`}>
                                  {loan.dueHint}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className={styles.amountCell}>{formatAmount(outstandingAmount)}</td>
                          <td className={styles.amountCell}>{formatAmount(totalAmount)}</td>
                          <td>
                            <div className={styles.progressContainer}>
                              <div className={styles.progressTrackCompact}>
                                <div
                                  className={styles.progressFill}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className={styles.progressText}>{Math.round(progress)}%</span>
                            </div>
                          </td>
                          <td className={styles.amountCell}>{formatAmount(emiAmount)}</td>
                          <td>
                            <div className={styles.actionCell}>
                              <MarkPaidButton loan={loan} onSelect={setSelectedPayment} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </AppShell>

      <AddLoanModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        existingNames={existingNames as any}
      />

      <MarkPaidModal
        selected={selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />
    </>
  );
}
