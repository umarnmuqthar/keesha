'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, Card, AddButton } from "@/components/ui";
import { useModalState } from "@/components/ui/useModalState";
import AddExpenseModal from "@/app/expenses/AddExpenseModal";
import styles from "./dashboard.module.css";
import { useRouter } from "next/navigation";

type DashboardClientProps = {
  highlights: any[];
  tasks: any[];
};

export default function DashboardClient({ highlights, tasks }: DashboardClientProps) {
  const modal = useModalState();
  const router = useRouter();

  const handleExpenseAdded = () => {
    modal.close();
    router.refresh();
  };

  return (
    <>
      <AppShell
        sidebar={<Sidebar />}
        header={
          <PageHeader
            title=""
            showSearch={false}
            actions={
              <AddButton size="sm" onClick={modal.open}>
                Add expense
              </AddButton>
            }
          />
        }
      >
        <div className={styles.page}>
          <section className={styles.hero}>
            {/* Minimalist hero - no text as requested */}
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
                Your financial health is looking strong this month with a consistent
                balance across your accounts.
              </p>
              <div className={styles.progress}>
                <span style={{ width: "72%" }} />
              </div>
              <Button size="sm">Open report</Button>
            </Card>
          </section>
        </div>
      </AppShell>

      <AddExpenseModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        onExpenseAdded={handleExpenseAdded}
      />
    </>
  );
}
