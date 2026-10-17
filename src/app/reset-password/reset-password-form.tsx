"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
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
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("The reset link is invalid or expired.");
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage("Password updated. Redirecting to your profile…");
      window.setTimeout(() => {
        router.replace("/profile");
        router.refresh();
      }, 700);
    } catch {
      setError("The reset link is invalid or expired. Request a new link and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card auth-card">
      <h1>Choose a new password</h1>
      <form className="form" onSubmit={submit}>
        <label>New password
          <input type="password" name="password" autoComplete="new-password" minLength={12} maxLength={128} required />
        </label>
        <label>Confirm new password
          <input type="password" name="confirmPassword" autoComplete="new-password" minLength={12} maxLength={128} required />
        </label>
        {error && <p role="alert" className="form-error">{error}</p>}
        {message && <p role="status" className="form-success">{message}</p>}
        <button className="button" type="submit" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
      </form>
      <div className="auth-links"><Link href="/login">Back to login</Link></div>
    </section>
  );
}
