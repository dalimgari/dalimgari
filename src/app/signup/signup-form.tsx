"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
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
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirmPassword") ?? "");

    if (password.length < 12 || password.length > 128) {
      setError("Use a password between 12 and 128 characters.");
      setBusy(false);
      return;
    }
    if (password !== confirm) {
      setError("The passwords do not match.");
      setBusy(false);
      return;
    }

    try {
      const origin = window.location.origin;
      const { data, error: authError } = await createSupabaseBrowserClient().auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${origin}/auth/callback?next=/profile` },
      });
      if (authError) throw authError;
      if (data.session) {
        router.replace("/profile");
        router.refresh();
      } else {
        setMessage("If registration is accepted, a verification email will be sent. Open its link to activate your account.");
      }
    } catch {
      setError("Registration could not be completed. Check the information and try again later.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card auth-card">
      <h1>Create account</h1>
      <form className="form" onSubmit={submit}>
        <label>Email
          <input type="email" name="email" autoComplete="email" maxLength={254} required />
        </label>
        <label>Password
          <input type="password" name="password" autoComplete="new-password" minLength={12} maxLength={128} required />
        </label>
        <label>Confirm password
          <input type="password" name="confirmPassword" autoComplete="new-password" minLength={12} maxLength={128} required />
        </label>
        {error && <p role="alert" className="form-error">{error}</p>}
        {message && <p role="status" className="form-success">{message}</p>}
        <button className="button" type="submit" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <div className="auth-links"><Link href="/login">Back to login</Link></div>
    </section>
  );
}
