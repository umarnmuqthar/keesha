'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
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
import styles from "./subscription-detail.module.css";

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
  createdAt?: string;
  ledger?: LedgerEntry[];
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

export default function SubscriptionDetailClient({ subscription }: { subscription: Subscription }) {
  const router = useRouter();
  const editModal = useModalState(false);

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
    amount: Number(subscription.currentCost || 0)
  });

  const ledgerHistory = useMemo(() => {
    return [...(subscription.ledger || [])].sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      return bTime - aTime;
    });
  }, [subscription.ledger]);

  const lifetimeSpend = useMemo(() => {
    return ledgerHistory.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [ledgerHistory]);

  const amortizedCost = calculateAmortizedMonthlyCost(
    Number(subscription.currentCost || 0),
    subscription.billingCycle || "Monthly"
  );
  const yearlyCost = calculateProjectedYearlyCost(
    Number(subscription.currentCost || 0),
    subscription.billingCycle || "Monthly"
  );
  const daysUntilDue = calculateDaysUntilDue(subscription.nextRenewalDate || todayIso());

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
    ...subscription,
    startDate: subscription.startDate || earliestLedgerDate || subscription.createdAt
  };

  const openStatusModal = (status: "Active" | "Cancelled") => {
    setNextStatus(status);
    if (status === "Cancelled" && subscription.nextRenewalDate) {
      setEffectiveDate(new Date(subscription.nextRenewalDate).toISOString().split("T")[0]);
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

      if (subscription.billingCycle === "Yearly") cursor.setFullYear(cursor.getFullYear() + 1);
      else if (subscription.billingCycle === "Quarterly") cursor.setMonth(cursor.getMonth() + 3);
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
          subscription.id,
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
          subscription.id,
          Number(manualPayment.amount || 0),
          dates
        );
      } else {
        result = await addManualPayment(
          subscription.id,
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
      const result = await updateSubscriptionStatus(subscription.id, nextStatus, effectiveDate);
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
        subscription.id,
        Number(subscription.currentCost || 0),
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
      const result = await deleteSubscription(subscription.id);
      if (result.success) {
        router.push("/subscriptions");
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
      <div className={styles.page}>
        <div className={styles.topRow}>
          <Link href="/subscriptions" className={styles.backLink}>← Back to subscriptions</Link>
          <div className={styles.actions}>
            <Button variant="secondary" size="sm" onClick={editModal.open}>Edit</Button>
            {subscription.status === "Active" ? (
              <Button variant="ghost" size="sm" onClick={() => openStatusModal("Cancelled")}>Cancel</Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => openStatusModal("Active")}>Resume</Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting}>Delete</Button>
          </div>
        </div>

        <Card className={styles.heroCard}>
          <div className={styles.identityRow}>
            <div>
              <h2>{subscription.name || "Subscription"}</h2>
              <p>{subscription.category || "Uncategorized"}</p>
            </div>
            <span className={styles.statusBadge}>{subscription.status || "Active"}</span>
          </div>
          <div className={styles.metaRow}>
            <span>Payment method: {subscription.paymentMethod || "Card"}</span>
            <span>Billing cycle: {subscription.billingCycle || "Monthly"}</span>
          </div>
        </Card>

        <section className={styles.summaryGrid}>
          <Card className={styles.summaryCard}>
            <p className={styles.label}>Monthly Cost</p>
            <h3>{formatCurrency(amortizedCost)}</h3>
            <span className={styles.meta}>{subscription.billingCycle || "Monthly"} billing</span>
          </Card>
          <Card className={styles.summaryCard}>
            <p className={styles.label}>Next Renewal</p>
            <h3>{formatDate(subscription.nextRenewalDate)}</h3>
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
            <span className={styles.meta}>From payment history</span>
          </Card>
        </section>

        {subscription.status === "Active" && daysUntilDue <= 0 ? (
          <div className={styles.inlineActionRow}>
            <Button onClick={() => setShowMarkPaidConfirm(true)}>Mark as paid</Button>
          </div>
        ) : null}

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIntro}>
              <h2>Payment history</h2>
              <p>Ledger of recorded subscription payments.</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className={styles.logPaymentBtn}
              onClick={() =>
                setManualPayment({
                  isOpen: true,
                  mode: "add",
                  type: "single",
                  date: todayIso(),
                  endDate: monthIso(),
                  amount: Number(subscription.currentCost || 0)
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
              <span className={styles.actionsHead}>Actions</span>
            </div>

            {ledgerHistory.length > 0 ? (
              ledgerHistory.map((entry) => (
                <div key={entry.id} className={styles.tableRow}>
                  <span className={styles.dateCell}>{formatDate(entry.date)}</span>
                  <span className={styles.amountCell}>{formatCurrency(Number(entry.amount || 0))}</span>
                  <span className={styles.typeCell}>{entry.type || "Manual Entry"}</span>
                  <span className={styles.rowActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={styles.rowActionBtn}
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
                      className={styles.rowActionBtn}
                      onClick={async () => {
                        const confirmed = window.confirm(
                          `Delete payment of ${formatCurrency(Number(entry.amount || 0))} from ${formatDate(entry.date)}?`
                        );
                        if (!confirmed) return;
                        await deletePaymentEntry(subscription.id, entry.id);
                        router.refresh();
                      }}
                    >
                      Delete
                    </Button>
                  </span>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>No payment history found.</div>
            )}
          </Card>
        </section>
      </div>

      <AddSubscriptionModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        initialData={modalInitialData as any}
        style={{}}
      />

      {statusModalOpen ? (
        <div className={styles.modalOverlay} onClick={() => setStatusModalOpen(false)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <h3>{nextStatus === "Cancelled" ? "Cancel subscription" : "Resume subscription"}</h3>
            <p>
              {nextStatus === "Cancelled"
                ? "Set an effective date to stop renewal tracking."
                : "Set a reactivation date to continue renewal tracking."}
            </p>
            <label className={styles.modalLabel}>
              {nextStatus === "Cancelled" ? "Cancellation date" : "Reactivation date"}
              <input
                type="date"
                value={effectiveDate}
                onChange={(event) => setEffectiveDate(event.target.value)}
              />
            </label>
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setStatusModalOpen(false)}>Cancel</Button>
              <Button isLoading={isUpdatingStatus} onClick={handleStatusChange}>
                {nextStatus === "Cancelled" ? "Cancel subscription" : "Resume subscription"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {manualPayment.isOpen ? (
        <div className={styles.modalOverlay} onClick={closeManualModal}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <h3>{manualPayment.mode === "edit" ? "Edit payment" : "Add payment"}</h3>
            <p>Log payment entries for this subscription ledger.</p>

            {manualPayment.mode === "add" ? (
              <div className={styles.switchRow}>
                <button
                  className={`${styles.switchBtn} ${manualPayment.type === "single" ? styles.switchBtnActive : ""}`}
                  onClick={() => setManualPayment((prev) => ({ ...prev, type: "single" }))}
                >
                  Single
                </button>
                <button
                  className={`${styles.switchBtn} ${manualPayment.type === "bulk" ? styles.switchBtnActive : ""}`}
                  onClick={() => setManualPayment((prev) => ({ ...prev, type: "bulk" }))}
                >
                  Bulk
                </button>
              </div>
            ) : null}

            <label className={styles.modalLabel}>
              {manualPayment.type === "bulk" && manualPayment.mode === "add" ? "Start date" : "Date"}
              <input
                type="date"
                value={manualPayment.date}
                onChange={(event) =>
                  setManualPayment((prev) => ({ ...prev, date: event.target.value }))
                }
              />
            </label>

            {manualPayment.type === "bulk" && manualPayment.mode === "add" ? (
              <label className={styles.modalLabel}>
                End month
                <input
                  type="month"
                  value={manualPayment.endDate}
                  onChange={(event) =>
                    setManualPayment((prev) => ({ ...prev, endDate: event.target.value }))
                  }
                />
                <span className={styles.modalHint}>
                  Generates {calculateBulkDates().length} entries ({subscription.billingCycle || "Monthly"})
                </span>
              </label>
            ) : null}

            <label className={styles.modalLabel}>
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={manualPayment.amount}
                onChange={(event) =>
                  setManualPayment((prev) => ({ ...prev, amount: Number(event.target.value || 0) }))
                }
              />
            </label>

            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={closeManualModal}>Cancel</Button>
              <Button onClick={handleManualPaymentSubmit}>
                {manualPayment.mode === "edit" ? "Save" : "Add"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showMarkPaidConfirm ? (
        <div className={styles.modalOverlay} onClick={() => setShowMarkPaidConfirm(false)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <h3>Mark as paid</h3>
            <p>
              Record a payment of {formatCurrency(Number(subscription.currentCost || 0))} for today?
            </p>
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setShowMarkPaidConfirm(false)}>Cancel</Button>
              <Button isLoading={isMarkingPaid} onClick={handleMarkAsPaid}>Confirm</Button>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteConfirm ? (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <h3>Delete subscription</h3>
            <p>This action cannot be undone. All payment history will be removed.</p>
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button isLoading={isDeleting} onClick={handleDeleteSubscription}>Delete</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
