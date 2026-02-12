'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AddButton, Button, Card } from '@/components/ui';
import { useModalState } from '@/components/ui/useModalState';
import {
  deleteLoan,
  deleteLoanPayment,
  toggleLoanPayment,
  updateLoanPayment
} from '@/app/actions/loanActions';
import AddLoanModal from '@/features/legacy/components/AddLoanModal';
import styles from './loan-detail.module.css';

type ScheduleEntry = {
  id?: string;
  date: string;
  amount: number;
};

type PaymentEntry = {
  paidAt?: string;
  amount?: number;
  description?: string;
  edited?: boolean;
};

type Loan = {
  id: string;
  name?: string;
  userId?: string;
  emiAmount?: number;
  monthlyEmi?: number;
  amount?: number;
  outstandingAmount?: number;
  remainingAmount?: number;
  interestRate?: number;
  totalPayable?: number;
  schedule?: ScheduleEntry[];
  [key: string]: any;
};

type LoanDetailClientProps = {
  loan: Loan;
  payments: Record<string, PaymentEntry>;
};

type PaymentFormState = {
  dueDate: string;
  amount: string;
  description: string;
};

const formatAmount = (value?: number) => {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString('en-IN')}`;
};

const formatDate = (raw: string) => {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export default function LoanDetailClient({ loan, payments }: LoanDetailClientProps) {
  const router = useRouter();
  const addPaymentModal = useModalState(false);
  const editLoanModal = useModalState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(() => ({
    dueDate: '',
    amount: String(Number(loan.emiAmount || loan.monthlyEmi || 0) || ''),
    description: ''
  }));

  const schedule = useMemo(() => {
    return [...(loan.schedule || [])].sort((a, b) => a.date.localeCompare(b.date));
  }, [loan.schedule]);

  const unpaidSchedule = useMemo(() => {
    return schedule.filter((entry) => !payments[entry.date]);
  }, [schedule, payments]);

  const paidSchedule = useMemo(() => {
    return schedule.filter((entry) => !!payments[entry.date]);
  }, [schedule, payments]);

  const nextDue = unpaidSchedule[0];

  const amountPaid = paidSchedule.reduce((sum, entry) => {
    const payment = payments[entry.date];
    return sum + Number(payment?.amount || entry.amount || 0);
  }, 0);

  const totalPayable = Number(loan.totalPayable || 0);
  const fallbackOutstanding = Number(loan.outstandingAmount || loan.remainingAmount || loan.amount || 0);
  const remaining = totalPayable > 0 ? Math.max(totalPayable - amountPaid, 0) : fallbackOutstanding;

  const progress = totalPayable > 0 ? Math.min((amountPaid / totalPayable) * 100, 100) : 0;

  const openAddPayment = () => {
    const targetDate = nextDue?.date || '';
    setPaymentForm({
      dueDate: targetDate,
      amount: String(Number(nextDue?.amount || loan.emiAmount || loan.monthlyEmi || 0) || ''),
      description: ''
    });
    addPaymentModal.open();
  };

  const handleAddPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!paymentForm.dueDate) return;
    const amount = Number(paymentForm.amount || 0);
    if (!amount || amount <= 0) return;

    setIsSubmittingPayment(true);
    try {
      const toggleRes = await toggleLoanPayment(loan.id, paymentForm.dueDate, true);
      if (!toggleRes.success) {
        throw new Error('Unable to add payment.');
      }

      const updateRes = await updateLoanPayment(loan.id, paymentForm.dueDate, {
        amount,
        newDate: paymentForm.dueDate,
        description: paymentForm.description || ''
      });

      if (!updateRes.success) {
        throw new Error(updateRes.message || 'Unable to update payment.');
      }

      addPaymentModal.close();
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to add payment.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleDeleteLoan = async () => {
    const confirmed = window.confirm('Delete this loan? This cannot be undone.');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await deleteLoan(loan.id);
      if (!res.success) throw new Error(res.message || 'Delete failed');
      router.push('/loans');
    } catch (error) {
      console.error(error);
      alert('Failed to delete loan.');
      setIsDeleting(false);
    }
  };

  const markAsPaid = async (date: string, amount: number) => {
    try {
      const toggleRes = await toggleLoanPayment(loan.id, date, true);
      if (!toggleRes.success) throw new Error('Toggle failed');

      await updateLoanPayment(loan.id, date, {
        amount: Number(amount || loan.emiAmount || 0),
        newDate: date,
        description: ''
      });

      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to mark installment as paid.');
    }
  };

  const markAsPending = async (date: string) => {
    try {
      const res = await deleteLoanPayment(loan.id, date);
      if (!res.success) throw new Error(res.message || 'Delete failed');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to mark installment as pending.');
    }
  };

  return (
    <>
      <div className={styles.page}>
        <div className={styles.backRow}>
          <Link href="/loans" className={styles.backLink}>← Back to loans</Link>
        </div>

        <section className={styles.summary}>
          <Card className={styles.summaryCard}>
            <p className={styles.label}>Outstanding</p>
            <h3>{formatAmount(remaining)}</h3>
            <span className={styles.meta}>Balance remaining</span>
          </Card>
          <Card className={styles.summaryCard}>
            <p className={styles.label}>Monthly EMI</p>
            <h3>{formatAmount(loan.emiAmount || loan.monthlyEmi)}</h3>
            <span className={styles.meta}>{nextDue ? `Next due ${formatDate(nextDue.date)}` : 'Loan settled'}</span>
          </Card>
          <Card className={styles.summaryCard}>
            <p className={styles.label}>Interest rate</p>
            <h3>{loan.interestRate ? `${loan.interestRate}%` : '—'}</h3>
            <span className={styles.meta}>APR</span>
          </Card>
        </section>

        <Card className={styles.progressCard}>
          <div className={styles.progressTop}>
            <div>
              <p className={styles.label}>Repayment progress</p>
              <h3>{Math.round(progress)}%</h3>
            </div>
            <div className={styles.progressStat}>
              Paid {formatAmount(amountPaid)} / {formatAmount(totalPayable || loan.amount)}
            </div>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </Card>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Payment ledger</h2>
              <p>All installments, status, and payment history.</p>
            </div>
            <div className={styles.actions}>
              <Button variant="secondary" size="sm" onClick={editLoanModal.open}>Edit loan</Button>
              <Button variant="ghost" size="sm" onClick={handleDeleteLoan} disabled={isDeleting}>Delete</Button>
              <AddButton size="sm" onClick={openAddPayment}>Add payment</AddButton>
            </div>
          </div>

          <Card className={styles.tableCard}>
            <div className={styles.tableHead}>
              <span>Due date</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {schedule.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>No installments generated</h3>
                <p>Edit this loan and add a schedule to start tracking payments.</p>
              </div>
            ) : (
              schedule.map((entry, index) => {
                const payment = payments[entry.date];
                const paid = Boolean(payment);
                const paidAmount = Number(payment?.amount || entry.amount || 0);

                return (
                  <div key={`${entry.date}-${index}`} className={styles.row}>
                    <span>{formatDate(entry.date)}</span>
                    <span>{formatAmount(paidAmount)}</span>
                    <span className={paid ? styles.statusPaid : styles.statusPending}>
                      {paid ? 'Paid' : 'Pending'}
                    </span>
                    <div className={styles.rowActions}>
                      {paid ? (
                        <Button variant="ghost" size="sm" onClick={() => markAsPending(entry.date)}>
                          Mark pending
                        </Button>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => markAsPaid(entry.date, Number(entry.amount || loan.emiAmount || 0))}>
                          Mark paid
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </section>
      </div>

      <AddLoanModal
        isOpen={editLoanModal.isOpen}
        onClose={editLoanModal.close}
        initialData={loan as any}
      />

      {addPaymentModal.isOpen ? (
        <div className={styles.modalOverlay} onClick={addPaymentModal.close}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <h3>Add payment</h3>
            <p>Record a payment for an upcoming installment.</p>

            <form className={styles.modalForm} onSubmit={handleAddPayment}>
              <label>
                Installment due date
                <select
                  value={paymentForm.dueDate}
                  onChange={(event) => {
                    const selectedDate = event.target.value;
                    const selectedEntry = schedule.find((entry) => entry.date === selectedDate);
                    setPaymentForm((prev) => ({
                      ...prev,
                      dueDate: selectedDate,
                      amount: String(Number(selectedEntry?.amount || loan.emiAmount || 0) || '')
                    }));
                  }}
                  required
                >
                  <option value="" disabled>Select due date</option>
                  {unpaidSchedule.map((entry) => (
                    <option key={entry.date} value={entry.date}>
                      {formatDate(entry.date)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(event) =>
                    setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))
                  }
                  required
                />
              </label>

              <label>
                Note (optional)
                <textarea
                  rows={3}
                  value={paymentForm.description}
                  onChange={(event) =>
                    setPaymentForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
              </label>

              <div className={styles.modalActions}>
                <Button type="button" variant="ghost" onClick={addPaymentModal.close}>Cancel</Button>
                <Button type="submit" isLoading={isSubmittingPayment} disabled={!unpaidSchedule.length}>
                  Save payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
