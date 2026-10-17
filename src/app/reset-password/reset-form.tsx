"use client";

import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetForm() {
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
    const confirmation = String(form.get("confirmation") ?? "");
    if (password.length < 12 || password.length > 128) {
      setError("Use a password between 12 and 128 characters.");
      setBusy(false);
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      const { error: updateError } = await createSupabaseBrowserClient().auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage("Password updated. You can now sign in.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The password could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>New password
        <input type="password" name="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      </label>
      <label>Confirm password
        <input type="password" name="confirmation" autoComplete="new-password" minLength={12} maxLength={128} required />
      </label>
      {error && <p role="alert" className="form-error">{error}</p>}
      {message && <p role="status" className="form-success">{message}</p>}
      <button className="button" type="submit" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
    </form>
  );
}
