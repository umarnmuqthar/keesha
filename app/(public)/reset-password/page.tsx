"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { Button, Card, Input } from "@/components/ui";
import { auth } from "@/lib/firebase";
import styles from "./reset-password.module.css";

type ResetStatus = "loading" | "ready" | "done" | "error";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = useMemo(() => searchParams.get("oobCode") || "", [searchParams]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ResetStatus>("loading");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let isMounted = true;

    const verifyCode = async () => {
      if (!oobCode) {
        if (isMounted) {
          setStatus("error");
          setError("Invalid or missing reset code.");
        }
        return;
      }

      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        if (isMounted) {
          setEmail(userEmail);
          setStatus("ready");
        }
      } catch (err) {
        if (isMounted) {
          setStatus("error");
          setError("This reset link is invalid or has expired.");
        }
      }
    };

    verifyCode();
    return () => {
      isMounted = false;
    };
  }, [oobCode]);

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus("done");
      router.push("/login?reset=success");
    } catch (err) {
      setError("Failed to reset password. Please request a new link.");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.kicker}>Almost there</p>
        <h1 className={styles.title}>Set a new secure password.</h1>
        <p className={styles.subtitle}>
          Choose a strong password to protect your financial data.
        </p>
      </div>

      <Card className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Reset password</h2>
          <p>Enter your new password below.</p>
        </div>

        {status === "loading" && (
          <div className={styles.notice}>Verifying reset link...</div>
        )}

        {status === "error" && error && (
          <div className={styles.error}>{error}</div>
        )}

        {status === "ready" && (
          <form className={styles.formGrid} onSubmit={handleReset}>
            {email ? (
              <div className={styles.notice}>
                Resetting password for <strong>{email}</strong>
              </div>
            ) : null}
            <label className={styles.field}>
              <span>New password</span>
              <div className={styles.passwordRow}>
                <Input
                  placeholder="Create a password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <label className={styles.field}>
              <span>Confirm password</span>
              <div className={styles.passwordRow}>
                <Input
                  placeholder="Repeat your password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>
            {error ? <div className={styles.error}>{error}</div> : null}
            <Button size="lg" type="submit" isLoading={loading}>
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>
        )}

        {status === "done" && (
          <div className={styles.notice}>Password updated. Redirecting...</div>
        )}

        <div className={styles.footer}>
          <Link href="/login">Return to sign in</Link>
        </div>
      </Card>
    </div>
  );
}
