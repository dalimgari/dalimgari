"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    try {
      const { error: resetError } = await createSupabaseBrowserClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (resetError) throw resetError;
      setMessage("If an account matches that email, a password-reset link will be sent.");
    } catch {
      setMessage("If an account matches that email, a password-reset link will be sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card auth-card">
      <h1>Reset password</h1>
      <p className="lead">Enter your account email to request a reset link.</p>
      <form className="form" onSubmit={submit}>
        <label>Email
          <input type="email" name="email" autoComplete="email" maxLength={254} required />
        </label>
        {error && <p role="alert" className="form-error">{error}</p>}
        {message && <p role="status" className="form-success">{message}</p>}
        <button className="button" type="submit" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
      </form>
      <div className="auth-links"><Link href="/login">Back to login</Link></div>
    </section>
  );
}
