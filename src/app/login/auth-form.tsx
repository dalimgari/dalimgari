"use client";

import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "reset";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        window.location.assign("/profile");
        return;
      }

      if (mode === "signup") {
        if (password.length < 12) {
          throw new Error("Use a password with at least 12 characters.");
        }
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile` },
        });
        if (authError) throw authError;
        if (data.session) {
          window.location.assign("/profile");
          return;
        }
        setMessage("If registration is allowed, check your email for the confirmation link.");
      } else {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        if (authError) throw authError;
        setMessage("If an account exists for this email, password-reset instructions will be sent.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The request could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="actions" aria-label="Authentication options">
        <button className={`button ${mode !== "login" ? "secondary" : ""}`} type="button" onClick={() => { setMode("login"); setMessage(""); setError(""); }}>Login</button>
        <button className={`button ${mode !== "signup" ? "secondary" : ""}`} type="button" onClick={() => { setMode("signup"); setMessage(""); setError(""); }}>Create account</button>
        <button className={`button ${mode !== "reset" ? "secondary" : ""}`} type="button" onClick={() => { setMode("reset"); setMessage(""); setError(""); }}>Reset password</button>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <label>Email
          <input type="email" name="email" autoComplete="email" maxLength={254} required />
        </label>
        {mode !== "reset" && <label>Password
          <input type="password" name="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={12} maxLength={128} required />
        </label>}
        {error && <p role="alert" className="form-error">{error}</p>}
        {message && <p role="status" className="form-success">{message}</p>}
        <button className="button" type="submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Login" : mode === "signup" ? "Create account" : "Send reset link"}
        </button>
      </form>
      <p className="muted-note">Authentication requires the Supabase URL and publishable key to be configured by the administrator.</p>
    </>
  );
}
