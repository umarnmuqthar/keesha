import { db } from "@/lib/firebase-admin";
import { getSession } from "@/app/actions/authActions";
import { getExpenses } from "@/app/actions/expenseActions";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  const userId = session?.uid;
  
  // 1. Fetch expenses for the current month
  const expenses = await getExpenses() as any[];
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const currentMonthExpenses = expenses.filter(e => (e.date || '').startsWith(currentMonth));
  const totalMonthly = currentMonthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const transactionCount = currentMonthExpenses.length;

  // 2. Fetch real active subscriptions
  let subscriptions: any[] = [];
  if (userId) {
    const subSnap = await db
      .collection("subscriptions")
      .where("userId", "==", userId)
      .get();
    subscriptions = subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  const activeSubs = subscriptions.filter(sub => String(sub.status || 'Active').toLowerCase() === 'active');

  // 3. Fetch real active loans
  let loans: any[] = [];
  if (userId) {
    const loansSnap = await db
      .collection("loans")
      .where("userId", "==", userId)
      .get();
    loans = loansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  const activeLoans = loans.filter(loan => String(loan.status || 'Active').toLowerCase() !== 'closed');

  // 4. Fetch real active debt balances
  let debtAccounts: any[] = [];
  if (userId) {
    const debtSnap = await db
      .collection("debt_accounts")
      .where("userId", "==", userId)
      .get();
    debtAccounts = debtSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  const activeDebts = debtAccounts.filter(d => String(d.status || 'Active').toLowerCase() !== 'settled');
  const totalDebtBalance = activeDebts.reduce((sum, d) => sum + Math.abs(Number(d.netBalance || 0)), 0);

  // 5. Compute upcoming renewals & EMI due dates
  let upcomingRenewalsCount = 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const upcomingTasks: any[] = [];

  // Subscriptions upcoming renewals
  activeSubs.forEach((sub: any) => {
    let dueDate: Date | null = null;
    if (sub.nextRenewalDate) {
      dueDate = new Date(`${sub.nextRenewalDate}T00:00:00`);
    } else if (sub.startDate) {
      const start = new Date(`${sub.startDate}T00:00:00`);
      if (!isNaN(start.getTime())) {
        const cycle = String(sub.billingCycle || 'Monthly').toLowerCase();
        dueDate = new Date(start);
        while (dueDate < now) {
          if (cycle === 'yearly') dueDate.setFullYear(dueDate.getFullYear() + 1);
          else if (cycle === 'quarterly') dueDate.setMonth(dueDate.getMonth() + 3);
          else dueDate.setMonth(dueDate.getMonth() + 1);
        }
      }
    }
    
    if (dueDate && !isNaN(dueDate.getTime())) {
      if (dueDate >= now && dueDate <= sevenDaysFromNow) {
        upcomingRenewalsCount++;
      }
      
      const amount = Number(sub.currentCost || sub.amount || 0);
      upcomingTasks.push({
        title: sub.name || 'Subscription',
        dueDate,
        detail: `Renews ${dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`,
        amount: `₹${amount.toLocaleString('en-IN')}`
      });
    }
  });

  // Loans upcoming EMI payments
  activeLoans.forEach((loan: any) => {
    const schedule = Array.isArray(loan.schedule) ? loan.schedule : [];
    const sortedSchedule = [...schedule].sort((a: any, b: any) => 
      String(a?.date || "").localeCompare(String(b?.date || ""))
    );
    
    let nextDueDate = loan.nextDueDate;
    let nextDueAmount = Number(loan.nextDueAmount || loan.emiAmount || loan.monthlyEmi || loan.amount || 0);
    
    if (!nextDueDate && sortedSchedule.length > 0) {
      const nextUnpaid = sortedSchedule.find((entry: any) => {
        if (!entry?.date) return false;
        const due = new Date(`${entry.date}T00:00:00`);
        return !isNaN(due.getTime()) && due >= now;
      });
      if (nextUnpaid) {
        nextDueDate = nextUnpaid.date;
        nextDueAmount = Number(nextUnpaid.amount || nextDueAmount);
      }
    }
    
    if (nextDueDate) {
      const due = new Date(`${nextDueDate}T00:00:00`);
      if (!isNaN(due.getTime())) {
        upcomingTasks.push({
          title: `${loan.name || 'Loan'} EMI`,
          dueDate: due,
          detail: `Due ${due.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`,
          amount: `₹${nextDueAmount.toLocaleString('en-IN')}`
        });
        
        if (due >= now && due <= sevenDaysFromNow) {
          upcomingRenewalsCount++;
        }
      }
    }
  });

  // Sort tasks chronologically by due date
  upcomingTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  // Top 5 actions
  const tasks = upcomingTasks.map(t => ({
    title: t.title,
    detail: t.detail,
    amount: t.amount
  })).slice(0, 5);

  const highlights = [
    { label: "Total Monthly", value: `₹${totalMonthly.toLocaleString('en-IN')}`, delta: "Expenses" },
    { label: "Transactions", value: String(transactionCount), delta: "This month" },
    { label: "Upcoming bills", value: String(upcomingRenewalsCount), delta: "Next 7 days" },
    { label: "Net Debts Owed", value: `₹${totalDebtBalance.toLocaleString('en-IN')}`, delta: "Outstanding" },
  ];

  return <DashboardClient highlights={highlights} tasks={tasks} />;
}
