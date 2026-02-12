"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { Button, Card, Input } from "@/components/ui";
import { auth } from "@/lib/firebase";
import { createSessionClient } from "@/lib/services/session";
import styles from "./signup.module.css";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setNotice("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(userCredential.user, { displayName: name });
      await sendEmailVerification(userCredential.user, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
      });

      setNotice("Verification email sent. Please check your inbox.");
      router.push("/verify-email");
    } catch (err: any) {
      console.error("Signup Error", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Email is already in use.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak.");
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (googleLoading) return;

    setGoogleLoading(true);
    setError("");
    setNotice("");

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();
      const sessionResult = await createSessionClient(idToken);

      if (sessionResult.ok) {
        window.location.href = "/";
      } else {
        setError(sessionResult.error || "Google sign-in failed.");
      }
    } catch (err) {
      console.error("Google Auth Error", err);
      setError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.kicker}>Join Keesha</p>
        <h1 className={styles.title}>Build your smarter money routine.</h1>
        <p className={styles.subtitle}>
          Bring every subscription, debt, and card into one clear workspace.
        </p>
      </div>

      <Card className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Create your account</h2>
          <p>Start tracking in under two minutes.</p>
        </div>
        {error ? <div className={styles.error}>{error}</div> : null}
        {notice ? <div className={styles.notice}>{notice}</div> : null}
        <div className={styles.socialRow}>
          <Button
            variant="secondary"
            type="button"
            onClick={handleGoogleAuth}
            isLoading={googleLoading}
            className={styles.socialButton}
          >
            <span className={styles.googleIcon} aria-hidden="true">
              <svg viewBox="0 0 48 48" role="presentation">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.1 1.53 7.5 2.8l5.5-5.5C33.7 3.7 29.3 2 24 2 14.6 2 6.5 7.6 2.9 15.6l6.7 5.2C11.3 14 17.2 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.1 24.5c0-1.4-.1-2.5-.3-3.6H24v6.8h12.5c-.5 3-2.1 5.6-4.5 7.4l6.9 5.4c4-3.7 6.2-9.2 6.2-16z"
                />
                <path
                  fill="#FBBC05"
                  d="M9.6 28.8c-1-3-1-6.3 0-9.3l-6.7-5.2c-2.9 5.9-2.9 12.9 0 18.8l6.7-4.3z"
                />
                <path
                  fill="#34A853"
                  d="M24 46c5.9 0 10.9-2 14.5-5.5l-6.9-5.4c-1.9 1.3-4.4 2.1-7.6 2.1-6.8 0-12.7-4.5-14.7-10.7l-6.7 4.3C6.5 40.4 14.6 46 24 46z"
                />
              </svg>
            </span>
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </Button>
          <div className={styles.divider}><span>or</span></div>
        </div>
        <form className={styles.formGrid} onSubmit={handleSignup}>
          <label className={styles.field}>
            <span>Full name</span>
            <Input
              name="name"
              placeholder="Jordan Lee"
              type="text"
              required
              disabled={loading || googleLoading}
            />
          </label>

          <label className={styles.field}>
            <span>Email</span>
            <Input
              name="email"
              placeholder="you@example.com"
              type="email"
              required
              disabled={loading || googleLoading}
            />
          </label>
          <label className={styles.field}>
            <span>Password</span>
            <div className={styles.passwordRow}>
              <Input
                name="password"
                placeholder="Create a password"
                type={showPassword ? "text" : "password"}
                required
                disabled={loading || googleLoading}
                minLength={6}
              />

              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading || googleLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <label className={styles.field}>
            <span>Confirm password</span>
            <div className={styles.passwordRow}>
              <Input
                name="confirmPassword"
                placeholder="Repeat your password"
                type={showConfirmPassword ? "text" : "password"}
                required
                disabled={loading || googleLoading}
                minLength={6}
              />

              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                disabled={loading || googleLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </label>
          <Button size="lg" type="submit" isLoading={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <div className={styles.footer}>
          <span>Already have an account?</span>
          <Link href="/login">Sign in</Link>
        </div>
      </Card>
    </div>
  );
}
