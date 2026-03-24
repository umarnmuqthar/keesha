'use client';

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { useModalState } from "@/components/ui/useModalState";
import AddSubscriptionModal from "@/features/legacy/components/AddSubscriptionModal";
import {
  addBulkPayments,
  addManualPayment,
  deletePaymentEntry,
  deleteSubscription,
  recordPayment,
  updatePaymentEntry,
  updateSubscriptionStatus
} from "@/app/actions/subscriptionActions";
import {
  calculateAmortizedMonthlyCost,
  calculateDaysUntilDue,
  calculateProjectedYearlyCost
} from "@/lib/keesha-logic";
import styles from "./subscriptionDetailsModal.module.css";
import { X, Calendar, CreditCard, Clock, TrendingUp } from "lucide-react";

type LedgerEntry = {
  id: string;
  amount?: number;
  type?: string;
  date: string;
};

type Subscription = {
  id: string;
  name?: string;
  category?: string;
  status?: string;
  billingCycle?: string;
  paymentMethod?: string;
  currentCost?: number;
  startDate?: string;
  nextRenewalDate?: string;
  lastPaymentDate?: string;
  createdAt?: string;
  ledger?: LedgerEntry[];
};

type SubscriptionDetailsModalProps = {
  subscription: Subscription | null;
  onClose: () => void;
};

type ManualPaymentState = {
  isOpen: boolean;
  mode: "add" | "edit";
  type: "single" | "bulk";
  ledgerId?: string | null;
  date: string;
  endDate: string;
  amount: number;
};

const todayIso = () => new Date().toISOString().split("T")[0];
const monthIso = () => new Date().toISOString().slice(0, 7);

const formatCurrency = (amount: number) => {
  const value = Number(amount || 0);
  const hasDecimals = Math.abs(value % 1) > 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0
  }).format(value);
};

const formatDate = (raw?: string) => {
  if (!raw) return "N/A";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function SubscriptionDetailsModal({ subscription, onClose }: SubscriptionDetailsModalProps) {
  const router = useRouter();
  const editModal = useModalState(false);
  const [internalSub, setInternalSub] = useState<Subscription | null>(subscription);
  const [isClosing, setIsClosing] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMarkPaidConfirm, setShowMarkPaidConfirm] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<"Active" | "Cancelled">("Cancelled");
  const [effectiveDate, setEffectiveDate] = useState(todayIso());
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [manualPayment, setManualPayment] = useState<ManualPaymentState>({
    isOpen: false,
    mode: "add",
    type: "single",
    ledgerId: null,
    date: todayIso(),
    endDate: monthIso(),
    amount: 0
  });

  useEffect(() => {
    if (subscription) {
      setInternalSub(subscription);
      setIsClosing(false);
    } else if (internalSub) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setInternalSub(null);
        setIsClosing(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [subscription, internalSub]);

  useEffect(() => {
    if (internalSub) {
      setManualPayment(prev => ({
        ...prev,
        amount: Number(internalSub.currentCost || 0)
      }));
    }
  }, [internalSub]);

  const ledgerHistory = useMemo(() => {
    return [...(internalSub?.ledger || [])].sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      return bTime - aTime;
    });
  }, [internalSub?.ledger]);

  if (!internalSub) return null;

  const lifetimeSpend = ledgerHistory.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const amortizedCost = calculateAmortizedMonthlyCost(
    Number(internalSub.currentCost || 0),
    internalSub.billingCycle || "Monthly"
  );
  const yearlyCost = calculateProjectedYearlyCost(
    Number(internalSub.currentCost || 0),
    internalSub.billingCycle || "Monthly"
  );
  const daysUntilDue = calculateDaysUntilDue(internalSub.nextRenewalDate || todayIso());

  const dueHint =
    daysUntilDue < 0
      ? `Overdue by ${Math.abs(daysUntilDue)} days`
      : daysUntilDue === 0
        ? "Due today"
        : `Due in ${daysUntilDue} days`;

  const dueHintClass =
    daysUntilDue < 0 ? styles.dueHintDanger : styles.dueHintSoon;

  const earliestLedgerDate =
    ledgerHistory.length > 0 ? ledgerHistory[ledgerHistory.length - 1].date : null;

  const modalInitialData = {
    ...internalSub,
    startDate: internalSub.startDate || earliestLedgerDate || internalSub.createdAt
  };

  const openStatusModal = (status: "Active" | "Cancelled") => {
    setNextStatus(status);
    if (status === "Cancelled" && internalSub.nextRenewalDate) {
      setEffectiveDate(new Date(internalSub.nextRenewalDate).toISOString().split("T")[0]);
    } else {
      setEffectiveDate(todayIso());
    }
    setStatusModalOpen(true);
  };

  const calculateBulkDates = () => {
    if (manualPayment.type !== "bulk") return [] as string[];
    const start = new Date(manualPayment.date);
    const end = new Date(manualPayment.endDate);
    if (start > end) return [] as string[];

    const dates: string[] = [];
    const cursor = new Date(start);
    let count = 0;

    while (cursor <= end && count < 50) {
      dates.push(new Date(cursor).toISOString());

      if (internalSub.billingCycle === "Yearly") cursor.setFullYear(cursor.getFullYear() + 1);
      else if (internalSub.billingCycle === "Quarterly") cursor.setMonth(cursor.getMonth() + 3);
      else cursor.setMonth(cursor.getMonth() + 1);

      count += 1;
    }
    return dates;
  };

  const closeManualModal = () => {
    setManualPayment((prev) => ({ ...prev, isOpen: false }));
  };

  const handleManualPaymentSubmit = async () => {
    try {
      let result;
      if (manualPayment.mode === "edit" && manualPayment.ledgerId) {
        result = await updatePaymentEntry(
          internalSub.id,
          manualPayment.ledgerId,
          Number(manualPayment.amount || 0),
          manualPayment.date
        );
      } else if (manualPayment.type === "bulk") {
        const dates = calculateBulkDates();
        if (dates.length === 0) {
          alert("No valid dates in range");
          return;
        }
        result = await addBulkPayments(
          internalSub.id,
          Number(manualPayment.amount || 0),
          dates
        );
      } else {
        result = await addManualPayment(
          internalSub.id,
          Number(manualPayment.amount || 0),
          manualPayment.date
        );
      }

      if (result?.success) {
        closeManualModal();
        router.refresh();
      } else {
        alert("Failed to save payment");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save payment");
    }
  };

  const handleStatusChange = async () => {
    setIsUpdatingStatus(true);
    try {
      const result = await updateSubscriptionStatus(internalSub.id, nextStatus, effectiveDate);
      if (result.success) {
        setStatusModalOpen(false);
        router.refresh();
      } else {
        alert(result.message || "Failed to update status");
      }
    } catch (error) {
      console.error(error);
      alert("System error updating status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setIsMarkingPaid(true);
    try {
      const result = await recordPayment(
        internalSub.id,
        Number(internalSub.currentCost || 0),
        new Date()
      );
      if (result.success) {
        setShowMarkPaidConfirm(false);
        router.refresh();
      } else {
        alert("Failed to record payment");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to record payment");
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleDeleteSubscription = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteSubscription(internalSub.id);
      if (result.success) {
        onClose();
        router.refresh();
      } else {
        alert(result.message || "Failed to delete subscription");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to delete subscription");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className={`${styles.modalOverlay} ${isClosing ? styles.modalOverlayClosing : ''}`} onClick={onClose}>
        <div className={`${styles.modalWindow} ${isClosing ? styles.modalWindowClosing : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeaderClose}>
            <h2>{internalSub.name || "Subscription"}</h2>
            <button onClick={onClose} className={styles.closeBtn} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>

          <div className={styles.modalContent}>
            <section className={styles.summary}>
              <Card className={styles.summaryCard}>
                <p className={styles.label}>Monthly Cost</p>
                <h3>{formatCurrency(amortizedCost)}</h3>
                <span className={styles.meta}>{internalSub.billingCycle || "Monthly"} billing</span>
              </Card>
              <Card className={styles.summaryCard}>
                <p className={styles.label}>Next Renewal</p>
                <h3>{formatDate(internalSub.nextRenewalDate)}</h3>
                <span className={`${styles.meta} ${dueHintClass}`}>{dueHint}</span>
              </Card>
              <Card className={styles.summaryCard}>
                <p className={styles.label}>Yearly Total</p>
                <h3>{formatCurrency(yearlyCost)}</h3>
                <span className={styles.meta}>Projected annual cost</span>
              </Card>
              <Card className={styles.summaryCard}>
                <p className={styles.label}>Lifetime Paid</p>
                <h3>{formatCurrency(lifetimeSpend)}</h3>
                <span className={styles.meta}>Total spent to date</span>
              </Card>
            </section>

            <section className={styles.actions}>
              <Button variant="secondary" size="sm" onClick={editModal.open}>Edit Subscription</Button>
              {internalSub.status === "Active" ? (
                <Button variant="secondary" size="sm" onClick={() => openStatusModal("Cancelled")}>Cancel Subscription</Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => openStatusModal("Active")}>Resume Subscription</Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting}>Delete</Button>
            </section>

            {internalSub.status === "Active" && daysUntilDue <= 0 && (
              <Button onClick={() => setShowMarkPaidConfirm(true)}>Mark current installment as paid</Button>
            )}

            <section className={styles.historySection}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Payment history</h2>
                  <p>All recorded payments for this subscription.</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setManualPayment({
                      isOpen: true,
                      mode: "add",
                      type: "single",
                      ledgerId: null,
                      date: todayIso(),
                      endDate: monthIso(),
                      amount: Number(internalSub.currentCost || 0)
                    })
                  }
                >
                  Log payment
                </Button>
              </div>

              <Card className={styles.tableCard}>
                <div className={styles.tableHead}>
                  <span>Date</span>
                  <span>Amount</span>
                  <span>Description</span>
                  <span>Actions</span>
                </div>

                {ledgerHistory.length > 0 ? (
                  ledgerHistory.map((entry) => (
                    <div key={entry.id} className={styles.tableRow}>
                      <span>{formatDate(entry.date)}</span>
                      <span>{formatCurrency(Number(entry.amount || 0))}</span>
                      <span>{entry.type || "Payment"}</span>
                      <div className={styles.rowActions}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setManualPayment({
                              isOpen: true,
                              mode: "edit",
                              type: "single",
                              ledgerId: entry.id,
                              date: new Date(entry.date).toISOString().split("T")[0],
                              endDate: monthIso(),
                              amount: Number(entry.amount || 0)
                            })
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const confirmed = window.confirm(`Delete record from ${formatDate(entry.date)}?`);
                            if (confirmed) {
                              await deletePaymentEntry(internalSub.id, entry.id);
                              router.refresh();
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>No payments recorded yet.</div>
                )}
              </Card>
            </section>
          </div>
        </div>
      </div>

      <AddSubscriptionModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        initialData={modalInitialData as any}
        style={{}}
      />

      {statusModalOpen && (
        <div className={styles.innerModalOverlay} onClick={() => setStatusModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{nextStatus === "Cancelled" ? "Cancel subscription" : "Resume subscription"}</h3>
            <p>Set the date for this status change.</p>
            <label className={styles.modalLabel}>
              Effective date
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </label>
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setStatusModalOpen(false)}>Cancel</Button>
              <Button isLoading={isUpdatingStatus} onClick={handleStatusChange}>Confirm</Button>
            </div>
          </div>
        </div>
      )}

      {manualPayment.isOpen && (
        <div className={styles.innerModalOverlay} onClick={closeManualModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{manualPayment.mode === "edit" ? "Edit payment" : "Log payment"}</h3>
            
            {manualPayment.mode === "add" && (
              <div className={styles.switchRow}>
                <button
                  className={`${styles.switchBtn} ${manualPayment.type === "single" ? styles.switchBtnActive : ""}`}
                  onClick={() => setManualPayment(prev => ({ ...prev, type: "single" }))}
                >
                  Single
                </button>
                <button
                  className={`${styles.switchBtn} ${manualPayment.type === "bulk" ? styles.switchBtnActive : ""}`}
                  onClick={() => setManualPayment(prev => ({ ...prev, type: "bulk" }))}
                >
                  Bulk
                </button>
              </div>
            )}

            <label className={styles.modalLabel}>
              {manualPayment.type === "bulk" ? "Start date" : "Date"}
              <input
                type="date"
                value={manualPayment.date}
                onChange={(e) => setManualPayment(prev => ({ ...prev, date: e.target.value }))}
              />
            </label>

            {manualPayment.type === "bulk" && (
              <label className={styles.modalLabel}>
                End month
                <input
                  type="month"
                  value={manualPayment.endDate}
                  onChange={(e) => setManualPayment(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </label>
            )}

            <label className={styles.modalLabel}>
              Amount
              <input
                type="number"
                value={manualPayment.amount}
                onChange={(e) => setManualPayment(prev => ({ ...prev, amount: Number(e.target.value) }))}
              />
            </label>

            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={closeManualModal}>Cancel</Button>
              <Button onClick={handleManualPaymentSubmit}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {showMarkPaidConfirm && (
        <div className={styles.innerModalOverlay} onClick={() => setShowMarkPaidConfirm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Record payment</h3>
            <p>Confirm payment record for {formatCurrency(Number(internalSub.currentCost || 0))}?</p>
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setShowMarkPaidConfirm(false)}>Cancel</Button>
              <Button isLoading={isMarkingPaid} onClick={handleMarkAsPaid}>Confirm</Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className={styles.innerModalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Delete subscription</h3>
            <p>This will permanently remove this subscription and its history. Delete anyway?</p>
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button isLoading={isDeleting} onClick={handleDeleteSubscription}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
