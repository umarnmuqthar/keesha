import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddButton, Button, Card } from "@/components/ui";
import shellStyles from "../app-shell.module.css";
import styles from "./subscriptions.module.css";
import { db } from "@/lib/firebase-admin";
import { getSession } from "@/app/actions/authActions";
import { cache } from "react";

const getSubscriptions = cache(async function getSubscriptions(userId?: string) {
  if (!userId) return [] as Array<any>;
  const snapshot = await db
    .collection("subscriptions")
    .where("userId", "==", userId)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
});

export default async function SubscriptionsPage() {
  const session = await getSession();
  const subscriptions = await getSubscriptions(session?.uid);

  return (
    <AppShell
      sidebar={<Sidebar />}
      header={
        <div className={shellStyles.header}>
          <div>
            <p className={shellStyles.eyebrow}>Subscriptions</p>
            <h1>Recurring payments</h1>
          </div>
          <div className={shellStyles.headerActions}>
            <AddButton size="sm">Add subscription</AddButton>
          </div>
        </div>
      }
    >
      <div className={styles.page}>
        <section className={styles.hero}>
          <div>
            <h2>Track every renewal</h2>
            <p>Monitor active, paused, and cancelled subscriptions in one view.</p>
          </div>
          <div className={styles.heroStats}>
            <Card className={styles.statCard}>
              <p className={styles.label}>Active</p>
              <h3>{subscriptions.length}</h3>
            </Card>
            <Card className={styles.statCard}>
              <p className={styles.label}>Monthly total</p>
              <h3>₹0</h3>
            </Card>
          </div>
        </section>

        <section className={styles.list}>
          {subscriptions.length === 0 ? (
            <Card className={styles.empty}>
              <h3>No subscriptions yet</h3>
              <p>Add your first subscription to start tracking renewals.</p>
              <AddButton size="sm">Add subscription</AddButton>
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
                    <span>{sub.billingCycle || "Monthly"}</span>
                    <strong>₹{sub.amount || 0}</strong>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}
