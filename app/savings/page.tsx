import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddButton, Card } from "@/components/ui";
import shellStyles from "../app-shell.module.css";
import styles from "./savings.module.css";

export default function SavingsPage() {
  return (
    <AppShell
      sidebar={<Sidebar />}
      header={
        <div className={shellStyles.header}>
          <div>
            <p className={shellStyles.eyebrow}>Savings</p>
            <h1>Goals & balances</h1>
          </div>
          <div className={shellStyles.headerActions}>
            <AddButton size="sm">Add goal</AddButton>
          </div>
        </div>
      }
    >
      <div className={styles.page}>
        <Card className={styles.placeholder}>
          <h3>No savings goals yet</h3>
          <p>Create a savings goal to start tracking progress.</p>
          <AddButton size="sm">Add goal</AddButton>
        </Card>
      </div>
    </AppShell>
  );
}
