import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddButton, Card } from "@/components/ui";
import shellStyles from "../app-shell.module.css";
import styles from "./incomes.module.css";

export default function IncomesPage() {
  return (
    <AppShell
      sidebar={<Sidebar />}
      header={
        <div className={shellStyles.header}>
          <div>
            <p className={shellStyles.eyebrow}>Income</p>
            <h1>Cash inflows</h1>
          </div>
          <div className={shellStyles.headerActions}>
            <AddButton size="sm">Add income</AddButton>
          </div>
        </div>
      }
    >
      <div className={styles.page}>
        <Card className={styles.placeholder}>
          <h3>No income entries yet</h3>
          <p>Add income sources to track monthly cash inflow.</p>
          <AddButton size="sm">Add income</AddButton>
        </Card>
      </div>
    </AppShell>
  );
}
