import { db } from "@/lib/firebase-admin";
import { getSession } from "@/app/actions/authActions";
import { cache } from "react";
import SubscriptionsPageClient from "./SubscriptionsPageClient";

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
  return <SubscriptionsPageClient subscriptions={subscriptions as any[]} />;
}
