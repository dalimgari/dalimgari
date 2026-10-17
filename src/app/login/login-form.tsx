"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    try {
      const { error: authError } = await createSupabaseBrowserClient().auth.signInWithPassword({ email, password });
      if (authError) {
        setError("The email or password is incorrect, or the account is not ready to sign in.");
        return;
      }
      router.replace("/profile");
      router.refresh();
    } catch {
      setError("Login is temporarily unavailable. Check the application configuration and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card auth-card">
      <h1>Login</h1>
      <form className="form" onSubmit={submit}>
        <label>Email
          <input type="email" name="email" autoComplete="email" maxLength={254} required />
        </label>
        <label>Password
          <input type="password" name="password" autoComplete="current-password" required />
        </label>
        {error && <p role="alert" className="form-error">{error}</p>}
        <button className="button" type="submit" disabled={busy}>{busy ? "Signing in…" : "Login"}</button>
      </form>
      <div className="auth-links">
        <Link href="/forgot-password">Forgot password?</Link>
        <Link href="/signup">Create account</Link>
      </div>
    </section>
  );
}
