import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import shellStyles from "../../app-shell.module.css";
import { db } from "@/lib/firebase-admin";
import { getSession } from "@/app/actions/authActions";
import SubscriptionDetailClient from "./SubscriptionDetailClient";

type SubscriptionRecord = {
  id: string;
  name?: string;
  userId?: string;
  [key: string]: any;
};

async function getSubscription(id: string, userId: string): Promise<(SubscriptionRecord & { ledger: any[] }) | null> {
  const docRef = db.collection("subscriptions").doc(id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return null;

  const subscription = { id: docSnap.id, ...(docSnap.data() as Record<string, any>) } as SubscriptionRecord;
  if (subscription.userId && subscription.userId !== userId) return null;

  const ledgerSnapshot = await docRef.collection("ledger").get();
  const ledger = ledgerSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

  return { ...subscription, ledger };
}

export default async function SubscriptionDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.uid) return notFound();

  const subscription = await getSubscription(params.id, session.uid);
  if (!subscription) return notFound();

  return (
    <AppShell
      sidebar={<Sidebar />}
      showSearch={false}
      header={
        <div className={shellStyles.header}>
          <div>
            <p className={shellStyles.eyebrow}>Subscription details</p>
            <h1>{subscription.name || "Subscription"}</h1>
          </div>
        </div>
      }
    >
      <SubscriptionDetailClient subscription={subscription as any} />
    </AppShell>
  );
}
