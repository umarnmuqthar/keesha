import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, Card } from "@/components/ui";
import styles from "./profile.module.css";
import { logoutUser, getSession } from "@/app/actions/authActions";
import { db } from "@/lib/firebase-admin";

export default async function ProfilePage() {
  const session = await getSession();
  const profileDoc = session?.uid
    ? await db.collection("users").doc(session.uid).get()
    : null;
  const profile = profileDoc?.exists ? profileDoc.data() : null;
  const sessionName = (session as { name?: string } | null)?.name;

  const name = profile?.name || sessionName || "Keesha User";
  const email = profile?.email || session?.email || "user@example.com";
  const photo =
    profile?.photoURL ||
    profile?.photoUrl ||
    profile?.photo ||
    profile?.avatar ||
    null;

  return (
    <AppShell
      sidebar={<Sidebar />}
      header={
        <PageHeader
          title="Your account"
          eyebrow="Profile"
          showSearch={false}
        />
      }
    >
      <div className={styles.page}>
        <Card className={styles.card}>
          <div className={styles.profileRow}>
            {photo ? (
              <img className={styles.avatar} src={photo} alt={name} />
            ) : (
              <div className={styles.avatarFallback}>
                {name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <h3>{name}</h3>
              <p>{email}</p>
            </div>
          </div>
          <div className={styles.details}>
            <div>
              <span>Name</span>
              <strong>{name}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{email}</strong>
            </div>
          </div>
          <form action={logoutUser}>
            <Button type="submit">Log out</Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
