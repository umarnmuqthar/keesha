import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddButton, Card } from "@/components/ui";
import shellStyles from "../app-shell.module.css";
import styles from "./expenses.module.css";

export default function ExpensesPage() {
  return (
    <AppShell
      sidebar={<Sidebar />}
      header={
        <div className={shellStyles.header}>
          <div>
            <p className={shellStyles.eyebrow}>Expenses</p>
            <h1>Monthly outflow</h1>
          </div>
          <div className={shellStyles.headerActions}>
            <AddButton size="sm">Add expense</AddButton>
          </div>
        </div>
      }
    >
      <div className={styles.page}>
        <Card className={styles.placeholder}>
          <h3>No expenses logged</h3>
          <p>Add expenses to track monthly outflow.</p>
          <AddButton size="sm">Add expense</AddButton>
        </Card>
      </div>
    </AppShell>
  );
}
