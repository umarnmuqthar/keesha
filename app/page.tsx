import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button, Card } from "@/components/ui";
import { db } from "@/lib/firebase-admin";
import { getSession } from "@/app/actions/authActions";
import shellStyles from "./app-shell.module.css";
import styles from "./dashboard.module.css";

const highlights = [
  { label: "Monthly spend", value: "₹2,430", delta: "+4.2%" },
  { label: "Upcoming renewals", value: "6", delta: "Next 7 days" },
  { label: "Debt balance", value: "₹18,400", delta: "-₹320" },
];

const tasks = [
  { title: "Spotify", detail: "Renews Feb 12", amount: "₹9.99" },
  { title: "Car loan", detail: "Due Feb 15", amount: "₹320" },
  { title: "Apple One", detail: "Renews Feb 18", amount: "₹16.95" },
];

export default async function DashboardPage() {
  const session = await getSession();
  const profileDoc = session?.uid
    ? await db.collection("users").doc(session.uid).get()
    : null;
  const profile = profileDoc?.exists ? profileDoc.data() : null;
  const sessionName = (session as { name?: string } | null)?.name;
  const name = profile?.name || sessionName || "Keesha User";
  const photo =
    profile?.photoURL ||
    profile?.photoUrl ||
    profile?.photo ||
    profile?.avatar ||
    null;

  return (
    <AppShell
      sidebar={<Sidebar />}
      showSearch={false}
      header={
        <div className={shellStyles.header}>
          <div>
            <p className={shellStyles.eyebrow}>Today</p>
            <h1>Dashboard</h1>
          </div>
          <div className={shellStyles.headerActions}>
            <Link href="/profile" className={styles.profileLink} aria-label="Open profile">
              {photo ? (
                <img className={styles.profileAvatar} src={photo} alt={name} />
              ) : (
                <span className={styles.profileAvatarFallback}>
                  {name.slice(0, 1).toUpperCase()}
                </span>
              )}
            </Link>
          </div>
        </div>
      }
    >
      <div className={styles.page}>
        <section className={styles.hero}>
          <div>
            <h2>Financial command center</h2>
            <p>See your month at a glance and stay ahead of renewals.</p>
          </div>
        </section>

        <section className={styles.grid}>
          {highlights.map((item) => (
            <Card key={item.label} className={styles.card}>
              <p className={styles.label}>{item.label}</p>
              <h3>{item.value}</h3>
              <span className={styles.delta}>{item.delta}</span>
            </Card>
          ))}
        </section>

        <section className={styles.split}>
          <Card className={styles.listCard}>
            <div className={styles.listHeader}>
              <div>
                <h3>Upcoming actions</h3>
                <p>Next renewals and due dates.</p>
              </div>
              <Button variant="ghost">View all</Button>
            </div>
            <div className={styles.list}>
              {tasks.map((task) => (
                <div key={task.title} className={styles.listRow}>
                  <div>
                    <h4>{task.title}</h4>
                    <p>{task.detail}</p>
                  </div>
                  <span>{task.amount}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className={styles.insight}>
            <h3>Cashflow forecast</h3>
            <p>
              You are projected to finish the month with 18% more savings than
              last month.
            </p>
            <div className={styles.progress}>
              <span style={{ width: "72%" }} />
            </div>
            <Button size="sm">Open report</Button>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
