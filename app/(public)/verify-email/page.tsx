"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { applyActionCode } from "firebase/auth";
import { Button, Card } from "@/components/ui";
import { auth } from "@/lib/firebase";
import styles from "./verify-email.module.css";

type VerifyStatus = "idle" | "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const oobCode = useMemo(() => searchParams.get("oobCode") || "", [searchParams]);
  const [status, setStatus] = useState<VerifyStatus>(oobCode ? "loading" : "idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const verifyCode = async () => {
      if (!oobCode) return;

      try {
        await applyActionCode(auth, oobCode);
        if (auth.currentUser) {
          await auth.currentUser.reload();
        }
        if (isMounted) {
          setStatus("success");
          setMessage("Email verified successfully. You can now sign in.");
        }
      } catch (err) {
        if (isMounted) {
          setStatus("error");
          setMessage("This verification link is invalid or has expired.");
        }
      }
    };

    verifyCode();
    return () => {
      isMounted = false;
    };
  }, [oobCode]);

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h1>Verify your email</h1>
          <p>Secure your account before you continue.</p>
        </div>

        {status === "loading" && (
          <div className={styles.notice}>Verifying your email...</div>
        )}

        {status === "success" && (
          <div className={styles.notice}>{message}</div>
        )}

        {status === "error" && (
          <div className={styles.error}>{message}</div>
        )}

        {status === "idle" && (
          <div className={styles.notice}>
            We sent a verification link to your inbox. Please click the link to
            activate your account.
          </div>
        )}

        <div className={styles.actions}>
          <Link href="/login" className={styles.link}>
            Back to sign in
          </Link>
          <Button
            variant="secondary"
            type="button"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>
      </Card>
    </div>
  );
}
