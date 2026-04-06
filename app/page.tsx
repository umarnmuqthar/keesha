import { getSession } from "@/app/actions/authActions";
import { getExpenses } from "@/app/actions/expenseActions";
import DashboardClient from "./DashboardClient";

const tasks = [
  { title: "Spotify", detail: "Renews Feb 12", amount: "₹9.99" },
  { title: "Car loan", detail: "Due Feb 15", amount: "₹320" },
  { title: "Apple One", detail: "Renews Feb 18", amount: "₹16.95" },
];

export default async function DashboardPage() {
  const session = await getSession();
  
  // 1. Fetch real-time data
  const expenses = await getExpenses() as any[];
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const currentMonthExpenses = expenses.filter(e => (e.date || '').startsWith(currentMonth));
  const totalMonthly = currentMonthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const transactionCount = currentMonthExpenses.length;

  const highlights = [
    { label: "Total Monthly", value: `₹${totalMonthly.toLocaleString('en-IN')}`, delta: "Expenses" },
    { label: "Transactions", value: String(transactionCount), delta: "This month" },
    { label: "Upcoming renewals", value: "6", delta: "Next 7 days" },
  ];

  return <DashboardClient highlights={highlights} tasks={tasks} />;
}
