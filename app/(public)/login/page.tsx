"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { Button, Card, Input } from "@/components/ui";
import { auth } from "@/lib/firebase";
import { createSessionClient } from "@/lib/services/session";
import styles from "./login.module.css";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const idToken = await userCredential.user.getIdToken(true);
      const sessionResult = await createSessionClient(idToken);

      if (sessionResult.ok) {
        window.location.href = "/";
      } else {
        setError(sessionResult.error || "Login failed");
      }
    } catch (err: any) {
      console.error("Login Error", err);
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (googleLoading) return;

    setGoogleLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken(true);
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
        <p className={styles.kicker}>Keesha Finance</p>
        <h1 className={styles.title}>Stay ahead of every bill, every month.</h1>
        <p className={styles.subtitle}>
          Track subscriptions, debts, and credit cards with a unified command
          center built for clarity.
        </p>
      </div>

      <Card className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Welcome back</h2>
          <p>Sign in to your finance cockpit.</p>
        </div>
        {error ? <div className={styles.error}>{error}</div> : null}
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
        <form className={styles.formGrid} onSubmit={handleLogin}>
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
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                required
                disabled={loading || googleLoading}
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
          <Button size="lg" type="submit" isLoading={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className={styles.footer}>
          <Link href="/forgot-password">Forgot password?</Link>
          <Link href="/signup">Create account</Link>
        </div>
      </Card>
    </div>
  );
}
