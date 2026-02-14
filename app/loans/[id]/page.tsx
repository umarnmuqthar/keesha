import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import shellStyles from "../../app-shell.module.css";
import { db } from "@/lib/firebase-admin";
import { getSession } from "@/app/actions/authActions";
import LoanDetailClient from "./LoanDetailClient";

export default async function LoanDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.uid) return notFound();

  const doc = await db.collection("loans").doc(params.id).get();
  if (!doc.exists) return notFound();
  const loan = { id: doc.id, ...doc.data() } as any;

  if (loan.userId && loan.userId !== session.uid) return notFound();

  const paymentsSnapshot = await db.collection("loans").doc(params.id).collection("payments").get();
  const payments = Object.fromEntries(
    paymentsSnapshot.docs.map((paymentDoc) => [paymentDoc.id, paymentDoc.data()])
  );

  return (
    <AppShell
      sidebar={<Sidebar />}
      showSearch={false}
      header={
        <div className={shellStyles.header}>
          <div>
            <p className={shellStyles.eyebrow}>Loan details</p>
            <h1>{loan.name || "Loan"}</h1>
          </div>
        </div>
      }
    >
      <LoanDetailClient loan={loan} payments={payments as Record<string, any>} />
    </AppShell>
  );
}
