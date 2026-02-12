"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import {
  generateAndSendOTP,
  resetPasswordWithOtp,
  verifyPasswordResetOtp,
} from "@/app/actions/authActions";
import styles from "./forgot-password.module.css";

type Step = "request" | "verify" | "reset" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setNotice("");

    const result = await generateAndSendOTP(email);
    if (result.success && result.verificationId) {
      setVerificationId(result.verificationId);
      setStep("verify");
      setNotice("We sent a 6-digit code to your email.");
    } else {
      setError(result.error || "Failed to send OTP.");
    }

    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setNotice("");

    const result = await verifyPasswordResetOtp(verificationId, code);
    if (result.success) {
      setStep("reset");
      setNotice("OTP verified. Set a new password.");
    } else {
      setError(result.error || "Invalid code.");
    }

    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    if (!verificationId || !code) {
      setError("Missing verification code. Please verify OTP first.");
      return;
    }

    const passwordPolicy =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!passwordPolicy) {
      setError(
        "Password must be at least 8 characters and include upper/lowercase, a number, and a symbol."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    const result = await resetPasswordWithOtp(verificationId, code, password);
    if (result.success) {
      setStep("done");
      setNotice("Password updated. You can sign in now.");
    } else {
      setError(result.error || "Failed to reset password.");
    }

    setLoading(false);
  };

  useEffect(() => {
    if (step !== "done") return;
    const timer = setTimeout(() => {
      router.push("/login");
    }, 1600);
    return () => clearTimeout(timer);
  }, [step, router]);

  const handleResend = async () => {
    if (loading || !email) return;
    setLoading(true);
    setError("");
    const result = await generateAndSendOTP(email);
    if (result.success && result.verificationId) {
      setVerificationId(result.verificationId);
      setNotice("We sent a new OTP to your email.");
    } else {
      setError(result.error || "Failed to resend OTP.");
    }
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.kicker}>Reset access</p>
        <h1 className={styles.title}>Recover your account securely.</h1>
        <p className={styles.subtitle}>
          Enter your email, verify the OTP, then set a new password.
        </p>
      </div>

      <Card className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Forgot password</h2>
          <p>We will send a one-time password to your email.</p>
        </div>

        {error ? <div className={styles.error}>{error}</div> : null}

        {step === "request" && (
          <form className={styles.formGrid} onSubmit={handleSendOtp}>
            <label className={styles.field}>
              <span>Email</span>
              <Input
                name="email"
                placeholder="you@example.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </label>
            <Button size="lg" type="submit" isLoading={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </form>
        )}

        {step === "verify" && (
          <form className={styles.formGrid} onSubmit={handleVerifyOtp}>
            <label className={styles.field}>
              <span>OTP code</span>
              <Input
                name="code"
                placeholder="Enter 6-digit code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </label>
            <Button size="lg" type="submit" isLoading={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
            <button
              type="button"
              className={styles.linkButton}
              onClick={handleResend}
              disabled={loading}
            >
              Resend OTP
            </button>
          </form>
        )}

        {step === "reset" && (
          <form className={styles.formGrid} onSubmit={handleResetPassword}>
            <label className={styles.field}>
              <span>New password</span>
              <div className={styles.passwordRow}>
                <Input
                  placeholder="Create a password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
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
            <p className={styles.helper}>
              Use 8+ characters with upper/lowercase, a number, and a symbol.
            </p>
            <label className={styles.field}>
              <span>Confirm password</span>
              <div className={styles.passwordRow}>
                <Input
                  placeholder="Repeat your password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
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
            <Button
              size="lg"
              type="submit"
              isLoading={loading}
              disabled={!verificationId || code.length !== 6}
            >
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>
        )}

        {step === "done" && (
          <div className={styles.notice}>
            Password updated successfully.
            <div className={styles.doneActions}>
              <Link href="/login" className={styles.link}>
                Back to sign in
              </Link>
            </div>
          </div>
        )}

        {step !== "done" && (
          <div className={styles.footer}>
            <Link href="/login">Back to sign in</Link>
          </div>
        )}
      </Card>
    </div>
  );
}
