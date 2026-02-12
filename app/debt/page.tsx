import { db } from "@/lib/firebase-admin";
import { getSession } from "@/app/actions/authActions";
import { cache } from "react";
import DebtPageClient from "./DebtPageClient";

const getDebtAccounts = cache(async function getDebtAccounts(userId?: string) {
  if (!userId) return [] as Array<any>;
  const snapshot = await db
    .collection("debt_accounts")
    .where("userId", "==", userId)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
});

export default async function DebtPage() {
  const session = await getSession();
  const accounts = await getDebtAccounts(session?.uid);

  return <DebtPageClient accounts={accounts as any[]} />;
}
