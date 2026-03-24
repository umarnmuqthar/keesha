import { db } from "@/lib/firebase-admin";
import { getSession } from "@/app/actions/authActions";
import { cache } from "react";
import LoansPageClient from "./LoansPageClient";

type ScheduleEntry = {
  date?: string;
  amount?: number;
};

type LoanRecord = {
  id: string;
  userId?: string;
  loanType?: string;
  status?: string;
  tenure?: number;
  loanAmount?: number;
  creditedAmount?: number;
  amount?: number;
  totalPayable?: number;
  emiAmount?: number;
  monthlyEmi?: number;
  outstandingAmount?: number;
  remainingAmount?: number;
  dueDate?: number;
  schedule?: ScheduleEntry[];
  paymentStatus?: "Paid" | "Due soon" | "Overdue";
  isOverdue?: boolean;
  dueHint?: string;
  nextDueDate?: string;
  nextDueAmount?: number;
  paidAmount?: number;
  outstandingBalance?: number;
  [key: string]: unknown;
};

type LoanPayment = {
  amount?: number;
};

type LoanMetrics = {
  activeLoans: number;
  closingInThreeMonths: number;
  totalPrincipal: number;
  totalPayable: number;
  totalOutstanding: number;
  lifetimeDebtRepaid: number;
  outstandingPercent: number;
  monthlyEmiDue: number;
  monthlyEmiPaid: number;
  monthlyEmiRemaining: number;
  paidInstallments: number;
  totalInstallments: number;
  salaryImpactPercent: number | null;
  monthlyIncome: number | null;
};

const getLoans = cache(async function getLoans(userId?: string) {
  if (!userId) return [] as Array<any>;
  const snapshot = await db.collection("loans").where("userId", "==", userId).get();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const loans = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const data = doc.data() as LoanRecord;
      const schedule = Array.isArray(data.schedule) ? [...data.schedule] : [];
      schedule.sort((a, b) => String(a?.date || "").localeCompare(String(b?.date || "")));

      const paymentsSnapshot = await db.collection("loans").doc(doc.id).collection("payments").get();
      const paymentsByDate = new Map<string, LoanPayment>();
      paymentsSnapshot.docs.forEach((paymentDoc) => {
        paymentsByDate.set(paymentDoc.id, (paymentDoc.data() || {}) as LoanPayment);
      });

      const baseAmount = toNumber(data.creditedAmount || data.loanAmount || data.amount);
      const totalPayable = toNumber(data.totalPayable || (schedule.length ? 0 : baseAmount));
      const fallbackOutstanding = toNumber(
        data.outstandingAmount || data.remainingAmount || data.amount || data.loanAmount || baseAmount
      );

      let paidAmount = 0;
      if (schedule.length > 0) {
        schedule.forEach((entry) => {
          if (!entry?.date || !paymentsByDate.has(entry.date)) return;
          const paymentRecord = paymentsByDate.get(entry.date);
          paidAmount += toNumber(paymentRecord?.amount || entry.amount);
        });
      } else {
        paymentsByDate.forEach((payment) => {
          paidAmount += toNumber(payment?.amount);
        });
      }

      const outstandingBalance = totalPayable > 0 ? Math.max(totalPayable - paidAmount, 0) : fallbackOutstanding;

      const nextUnpaid = schedule.find((entry) => entry?.date && !paymentsByDate.has(String(entry.date)));
      const nextDueDate = nextUnpaid?.date ? String(nextUnpaid.date) : "";
      const nextDueAmount = toNumber(nextUnpaid?.amount || data.emiAmount || data.monthlyEmi || data.amount);

      let dueHint = "No upcoming EMI";
      let isOverdue = false;

      if (nextDueDate) {
        const due = asDate(nextDueDate);
        if (due) {
          const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            isOverdue = true;
            dueHint = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}`;
          } else if (diffDays === 0) {
            dueHint = "Due today";
          } else {
            dueHint = `Due in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
          }
        }
      }

      let paymentStatus: LoanRecord["paymentStatus"] = "Due soon";
      const thisMonthEntry = schedule.find((entry) => String(entry?.date || "").startsWith(monthKey));
      if (thisMonthEntry?.date) {
        if (paymentsByDate.has(String(thisMonthEntry.date))) {
          paymentStatus = "Paid";
        } else {
          const thisMonthDue = asDate(String(thisMonthEntry.date));
          paymentStatus = thisMonthDue && thisMonthDue < today ? "Overdue" : "Due soon";
        }
      } else if (isOverdue) {
        paymentStatus = "Overdue";
      }

      return {
        ...data,
        id: doc.id,
        nextDueDate,
        nextDueAmount,
        dueHint,
        isOverdue,
        paymentStatus,
        paidAmount,
        outstandingBalance,
        payments: Object.fromEntries(paymentsByDate),
      };
    })
  );

  return loans;
});

const toNumber = (value: unknown) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asDate = (raw?: string) => {
  if (!raw) return null;
  const date = new Date(`${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getUserMonthlyIncome = (profile: Record<string, unknown> | null) => {
  if (!profile) return null;

  const candidates = [
    "monthlyIncome",
    "salary",
    "salaryAmount",
    "income",
    "incomePerMonth",
    "inHandSalary",
  ] as const;

  for (const key of candidates) {
    const amount = toNumber(profile[key]);
    if (amount > 0) return amount;
  }

  return null;
};

async function getLoanMetrics(userId: string | undefined, loans: LoanRecord[]): Promise<LoanMetrics> {
  if (!userId || loans.length === 0) {
    return {
      activeLoans: 0,
      closingInThreeMonths: 0,
      totalPrincipal: 0,
      totalPayable: 0,
      totalOutstanding: 0,
      lifetimeDebtRepaid: 0,
      outstandingPercent: 0,
      monthlyEmiDue: 0,
      monthlyEmiPaid: 0,
      monthlyEmiRemaining: 0,
      paidInstallments: 0,
      totalInstallments: 0,
      salaryImpactPercent: null,
      monthlyIncome: null,
    };
  }

  const [profileDoc, loanPayments] = await Promise.all([
    db.collection("users").doc(userId).get(),
    Promise.all(
      loans.map(async (loan) => {
        const snapshot = await db.collection("loans").doc(loan.id).collection("payments").get();
        const map = new Map<string, LoanPayment>();
        snapshot.docs.forEach((doc) => {
          map.set(doc.id, (doc.data() || {}) as LoanPayment);
        });
        return { loanId: loan.id, payments: map };
      }),
    ),
  ]);

  const paymentsByLoan = new Map(loanPayments.map((item) => [item.loanId, item.payments]));
  const monthlyIncome = getUserMonthlyIncome(
    profileDoc.exists ? (profileDoc.data() as Record<string, unknown>) : null,
  );

  const today = new Date();
  const threeMonthsLater = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  let activeLoans = 0;
  let closingInThreeMonths = 0;
  let totalPrincipal = 0;
  let totalPayable = 0;
  let totalOutstanding = 0;
  let monthlyEmiDue = 0;
  let monthlyEmiPaid = 0;
  let paidInstallments = 0;
  let totalInstallments = 0;

  for (const loan of loans) {
    const schedule = Array.isArray(loan.schedule) ? loan.schedule : [];
    const payments = paymentsByLoan.get(loan.id) || new Map<string, LoanPayment>();
    const isClosed = String(loan.status || "Active").toLowerCase() === "closed";
    const isActive = !isClosed;

    if (isActive) activeLoans += 1;

    const loanPrincipal = toNumber(loan.loanAmount || loan.amount || loan.totalPayable);
    const payable = toNumber(loan.totalPayable || loan.loanAmount || loan.amount);
    const fallbackOutstanding = toNumber(
      loan.outstandingAmount || loan.remainingAmount || loan.amount || loan.loanAmount,
    );

    totalPrincipal += loanPrincipal;
    totalPayable += payable;

    let amountPaid = 0;
    if (schedule.length > 0) {
      for (const entry of schedule) {
        if (!entry?.date || !payments.has(entry.date)) continue;
        const paymentRecord = payments.get(entry.date);
        const paidAmount = toNumber(paymentRecord?.amount || entry.amount);
        amountPaid += paidAmount;
      }
    } else {
      payments.forEach((paymentRecord) => {
        amountPaid += toNumber(paymentRecord?.amount);
      });
    }

    const outstanding = payable > 0 ? Math.max(payable - amountPaid, 0) : fallbackOutstanding;
    totalOutstanding += outstanding;

    if (isActive) {
      let projectedCloseDate: Date | null = null;
      if (schedule.length > 0) {
        const unpaidDates = schedule
          .filter((entry) => entry?.date && !payments.has(String(entry.date)))
          .map((entry) => asDate(String(entry.date)))
          .filter((date): date is Date => Boolean(date))
          .sort((a, b) => a.getTime() - b.getTime());
        projectedCloseDate = unpaidDates.length > 0 ? unpaidDates[unpaidDates.length - 1] : null;
      } else {
        const emi = toNumber(loan.emiAmount || loan.monthlyEmi);
        if (emi > 0 && outstanding > 0) {
          const monthsLeft = Math.ceil(outstanding / emi);
          projectedCloseDate = new Date(today.getFullYear(), today.getMonth() + monthsLeft, today.getDate());
        }
      }

      if (projectedCloseDate && projectedCloseDate <= threeMonthsLater) {
        closingInThreeMonths += 1;
      }
    }

    if (isActive && schedule.length > 0) {
      totalInstallments += schedule.length;
      paidInstallments += schedule.filter((entry) => entry?.date && payments.has(String(entry.date))).length;

      const dueThisMonth = schedule.filter((entry) => String(entry?.date || "").startsWith(currentMonthKey));
      for (const entry of dueThisMonth) {
        const dueAmount = toNumber(entry.amount || loan.emiAmount || loan.monthlyEmi);
        monthlyEmiDue += dueAmount;
        if (entry?.date && payments.has(entry.date)) {
          const paymentRecord = payments.get(entry.date);
          monthlyEmiPaid += Math.min(toNumber(paymentRecord?.amount || dueAmount), dueAmount);
        }
      }
    } else if (isActive) {
      const emi = toNumber(loan.emiAmount || loan.monthlyEmi || loan.amount);
      monthlyEmiDue += emi;

      const tenure = toNumber(loan.tenure);
      if (tenure > 0) {
        totalInstallments += tenure;
        paidInstallments += Math.min(payments.size, tenure);
      }

      const rawDay = Math.max(1, Math.min(31, toNumber(loan.dueDate)));
      const dueDate = `${currentMonthKey}-${String(rawDay).padStart(2, "0")}`;
      if (payments.has(dueDate)) {
        const paymentRecord = payments.get(dueDate);
        monthlyEmiPaid += Math.min(toNumber(paymentRecord?.amount || emi), emi);
      }
    }
  }

  const monthlyEmiRemaining = Math.max(monthlyEmiDue - monthlyEmiPaid, 0);
  const lifetimeDebtRepaid = Math.max(totalPayable - totalOutstanding, 0);
  const outstandingPercent = totalPayable > 0 ? Math.min((totalOutstanding / totalPayable) * 100, 100) : 0;
  const salaryImpactPercent =
    monthlyIncome && monthlyIncome > 0 ? Math.min((monthlyEmiDue / monthlyIncome) * 100, 999) : null;

  return {
    activeLoans,
    closingInThreeMonths,
    totalPrincipal,
    totalPayable,
    totalOutstanding,
    lifetimeDebtRepaid,
    outstandingPercent,
    monthlyEmiDue,
    monthlyEmiPaid,
    monthlyEmiRemaining,
    paidInstallments,
    totalInstallments,
    salaryImpactPercent,
    monthlyIncome,
  };
}

export default async function LoansPage() {
  const session = await getSession();
  const loans = (await getLoans(session?.uid)) as LoanRecord[];
  const metrics = await getLoanMetrics(session?.uid, loans);

  return <LoansPageClient loans={loans as any[]} metrics={metrics} />;
}
