import { getSession } from "@/app/actions/authActions";
import { getExpenses } from "@/app/actions/expenseActions";
import ExpensesPageClient from "./ExpensesPageClient";
import { redirect } from "next/navigation";

export default async function ExpensesPage() {
  const session = await getSession();
  if (!session) redirect('/auth/login');

  const expenses = await getExpenses();

  return <ExpensesPageClient initialExpenses={expenses} />;
}
