'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { useShellSearch } from '@/components/layout/ShellSearchContext';
import { AddButton, Card } from '@/components/ui';
import { useModalState } from '@/components/ui/useModalState';
import AddLoanModal from '@/features/legacy/components/AddLoanModal';
import shellStyles from '../app-shell.module.css';
import styles from './loans.module.css';

type Loan = {
  id: string;
  name?: string;
  lender?: string;
  type?: string;
  loanType?: string;
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

export default function LoansPageClient({ loans, metrics }: LoansPageClientProps) {
  const modal = useModalState(false);
  const { query: searchQuery } = useShellSearch();
  const query = searchQuery.trim().toLowerCase();
  const monthShort = new Date().toLocaleDateString('en-GB', { month: 'short' });

  const filteredLoans = useMemo(() => {
    const base = query
      ? loans.filter((loan) =>
          [loan.name, loan.lender, loan.type]
            .map((value) => String(value || '').toLowerCase())
            .some((value) => value.includes(query))
        )
      : loans;

    return [...base].sort((a, b) => {
      const dueDelta = getDueTimestamp(a) - getDueTimestamp(b);
      if (dueDelta !== 0) return dueDelta;
      return String(a.name || '').localeCompare(String(b.name || ''), 'en');
    });
  }, [loans, query]);

  const existingNames = loans.map((loan) => loan.name || '').filter(Boolean);

  return (
    <>
      <AppShell
        sidebar={<Sidebar />}
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
              filteredLoans.map((loan) => {
                const paidAmount = Number(loan.paidAmount || 0);
                const totalAmount = Number(loan.totalPayable || loan.amount || 0);
                const emiAmount = Number(loan.nextDueAmount || loan.emiAmount || loan.monthlyEmi || loan.amount || 0);
                const outstandingAmount = Number(loan.outstandingBalance || loan.remainingAmount || 0);
                const progress = Math.max(
                  0,
                  Math.min(
                    (paidAmount / Math.max(totalAmount, 1)) * 100,
                    100
                  )
                );

                return (
                  <Link key={loan.id} href={`/loans/${loan.id}`} className={styles.itemLink}>
                    <Card className={styles.item}>
                      <div className={styles.itemIdentity}>
                        <h3>{loan.name || 'Loan'}</h3>
                        <p>
                          {loan.loanType === 'Consumer'
                            ? 'Consumer Loan'
                            : 'Personal Loan'}
                        </p>
                      </div>

                      <div className={`${styles.metricBlock} ${styles.metricMonthly}`}>
                        <span className={styles.progressMeta}>Monthly EMI</span>
                        <strong>{formatAmount(emiAmount)}</strong>
                      </div>

                      <div className={`${styles.metricBlock} ${styles.metricOutstanding}`}>
                        <span className={styles.progressMeta}>Outstanding</span>
                        <strong>{formatAmount(outstandingAmount)}</strong>
                      </div>

                      <div className={styles.itemProgress}>
                        <div className={styles.progressRow}>
                          <span className={styles.progressAmount}>Paid {formatAmount(paidAmount)} / {formatAmount(totalAmount)}</span>
                          <span className={styles.progressPercent}>{Math.round(progress)}%</span>
                        </div>
                        <div className={styles.progressTrack}>
                          <div
                            className={styles.progressFill}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className={styles.nextMetaRow}>
                          <p className={styles.nextEmi}>Next EMI: {formatDate(loan.nextDueDate)}</p>
                          {loan.dueHint ? (
                            <span className={`${styles.nextDueHint} ${loan.isOverdue ? styles.dueHintDanger : styles.dueHintSoon}`}>
                              {loan.dueHint}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })
            )}
          </section>
        </div>
      </AppShell>

      <AddLoanModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        existingNames={existingNames as any}
      />
    </>
  );
}
