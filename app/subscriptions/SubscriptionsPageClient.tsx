'use client';

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddButton, Card } from "@/components/ui";
import { useModalState } from "@/components/ui/useModalState";
import AddSubscriptionModal from "@/features/legacy/components/AddSubscriptionModal";
import shellStyles from "../app-shell.module.css";
import styles from "./subscriptions.module.css";

type Subscription = {
  id: string;
  name?: string;
  category?: string;
  status?: string;
  billingCycle?: string;
  cycle?: string;
  currentCost?: number | string;
  amount?: number | string;
};

type SubscriptionsPageClientProps = {
  subscriptions: Subscription[];
};

const toNumber = (value: unknown) => {
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const parsed = Number(cleaned || 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
};

const getCycle = (sub: Subscription) => {
  return String(sub?.billingCycle || sub?.cycle || "Monthly");
};

const getSubscriptionAmount = (sub: Subscription) => {
  return toNumber(sub?.currentCost ?? sub?.amount ?? 0);
};

const getAnnualAmount = (amount: number, billingCycle?: string) => {
  const cycle = String(billingCycle || "Monthly").toLowerCase();
  if (cycle === "yearly") return amount;
  if (cycle === "quarterly") return amount * 4;
  return amount * 12;
};

export default function SubscriptionsPageClient({ subscriptions }: SubscriptionsPageClientProps) {
  const modal = useModalState(false);
  const monthShort = new Date().toLocaleDateString("en-GB", { month: "short" });

  const activeSubscriptions = subscriptions.filter((sub) => {
    const status = String(sub?.status || "").toLowerCase();
    return status === "active" || status === "free trial" || status === "";
  });

  const yearlyTotal = activeSubscriptions.reduce((sum, sub) => {
    const amount = getSubscriptionAmount(sub);
    return sum + getAnnualAmount(amount, getCycle(sub));
  }, 0);

  const monthlyOutflow = yearlyTotal / 12;
  const existingNames = subscriptions.map((sub) => sub.name || "").filter(Boolean);

  return (
    <>
      <AppShell
        sidebar={<Sidebar />}
        header={
          <div className={shellStyles.header}>
            <div>
              <p className={shellStyles.eyebrow}>Subscriptions</p>
              <h1>Recurring payments</h1>
            </div>
            <div className={shellStyles.headerActions}>
              <AddButton size="sm" onClick={modal.open}>Add subscription</AddButton>
            </div>
          </div>
        }
      >
        <div className={styles.page}>
          <section className={styles.hero}>
            <div className={styles.heroStats}>
              <Card className={styles.statCard}>
                <p className={styles.label}>Active</p>
                <h3>{activeSubscriptions.length}</h3>
              </Card>
              <Card className={styles.statCard}>
                <p className={styles.label}>Yearly Total</p>
                <h3>₹{yearlyTotal.toLocaleString("en-IN")}</h3>
              </Card>
              <Card className={styles.statCard}>
                <p className={styles.label}>Monthly Outflow ({monthShort})</p>
                <h3>₹{Math.round(monthlyOutflow).toLocaleString("en-IN")}</h3>
              </Card>
            </div>
          </section>

          <section className={styles.list}>
            {subscriptions.length === 0 ? (
              <Card className={styles.empty}>
                <h3>No subscriptions yet</h3>
                <p>Add your first subscription to start tracking renewals.</p>
                <AddButton size="sm" onClick={modal.open}>Add subscription</AddButton>
              </Card>
            ) : (
              subscriptions.map((sub) => (
                <Link key={sub.id} href={`/subscriptions/${sub.id}`} className={styles.itemLink}>
                  <Card className={styles.item}>
                    <div>
                      <h3>{sub.name || "Subscription"}</h3>
                      <p>{sub.category || "Uncategorized"}</p>
                    </div>
                    <div className={styles.itemMeta}>
                      <span>{getCycle(sub)}</span>
                      <strong>₹{getSubscriptionAmount(sub).toLocaleString("en-IN")}</strong>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </section>
        </div>
      </AppShell>

      <AddSubscriptionModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        existingNames={existingNames as any}
        style={{}}
      />
    </>
  );
}
