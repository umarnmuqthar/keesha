import { db } from "@/lib/firebase-admin";
import { getSession } from "@/app/actions/authActions";
import { cache } from "react";
import LoansPageClient from "./LoansPageClient";

const getLoans = cache(async function getLoans(userId?: string) {
  if (!userId) return [] as Array<any>;
  const snapshot = await db.collection("loans").where("userId", "==", userId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
});

export default async function LoansPage() {
  const session = await getSession();
  const loans = await getLoans(session?.uid);

  return <LoansPageClient loans={loans as any[]} />;
}
