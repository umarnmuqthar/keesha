import { getSession } from "@/app/actions/authActions";
import { getIncomes } from "@/app/actions/incomeActions";
import { getUserProfile } from "@/app/actions/profileActions";
import IncomesPageClient from "./IncomesPageClient";

export default async function IncomesPage() {
  const session = await getSession();
  const [incomes, userProfile] = await Promise.all([
    session ? getIncomes(session.uid) : [],
    getUserProfile()
  ]);

  return <IncomesPageClient initialIncomes={incomes as any[]} userProfile={userProfile as any} />;
}
