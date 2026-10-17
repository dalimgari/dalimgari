"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ManagedUser = {
  id: string;
  email?: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  role: "admin" | "member";
  email_confirmed_at?: string | null;
};

export function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user || user.app_metadata?.role !== "admin") {
        throw new Error("Administrator access is required.");
      }
      setCurrentUserId(user.id);
      const { data, error: invokeError } = await supabase.functions.invoke("admin-user-management", {
        body: { action: "list_users" },
      });
      if (invokeError) throw invokeError;
      const list = Array.isArray(data?.users) ? data.users as ManagedUser[] : [];
      setUsers(list);
      // The protected Edge Function intentionally omits the designated Super Admin from list_users.
      setIsSuperAdmin(!list.some((item) => item.id === user.id));
    } catch {
      setError("User records could not be loaded. Verify the admin-user-management Edge Function and account permissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(body: Record<string, unknown>, successMessage: string) {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const { data, error: invokeError } = await createSupabaseBrowserClient()
        .functions.invoke("admin-user-management", { body });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(String(data.error));
      setMessage(successMessage);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The request could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const admin = isSuperAdmin && form.get("admin") === "on";
    if (!email || password.length < 12 || password.length > 128) {
      setError("Enter a valid email and a password between 12 and 128 characters.");
      return;
    }
    await runAction({ action: "create_user", email, password, admin }, "Account created.");
    formElement.reset();
  }

  async function toggleRole(target: ManagedUser) {
    if (!isSuperAdmin || target.id === currentUserId && target.role === "admin") return;
    const makeAdmin = target.role !== "admin";
    await runAction(
      { action: "set_admin", user_id: target.id, admin: makeAdmin },
      makeAdmin ? "Administrator access granted." : "Account changed to Member.",
    );
  }

  async function deleteUser(target: ManagedUser) {
    if (target.id === currentUserId) return;
    const accepted = window.confirm(`Delete the account ${target.email || target.id}? This action cannot be undone.`);
    if (!accepted) return;
    await runAction({ action: "delete_user", user_id: target.id }, "Account deleted.");
  }

  return (
    <section className="user-management">
      <article className="card">
        <h2>Create account</h2>
        <form className="form wide-form" onSubmit={createUser}>
          <label>Email
            <input type="email" name="email" autoComplete="off" maxLength={254} required />
          </label>
          <label>Temporary password
            <input type="password" name="password" autoComplete="new-password" minLength={12} maxLength={128} required />
          </label>
          {isSuperAdmin && (
            <label className="inline-checkbox">
              <input type="checkbox" name="admin" />
              Grant Admin role
            </label>
          )}
          <p className="muted-note">New accounts default to Member. Only the designated Super Admin can grant Admin access.</p>
          <button className="button" type="submit" disabled={busy}>{busy ? "Working…" : "Create account"}</button>
        </form>
      </article>

      <section className="section">
        <h2>Accounts</h2>
        <p className="muted-note">Guest means a visitor who is not signed in; Guests are not stored as accounts.</p>
        {message && <p role="status" className="form-success">{message}</p>}
        {error && <p role="alert" className="form-error">{error}</p>}
        {loading ? <article className="card"><p>Loading accounts…</p></article> :
          users.length === 0 ? <article className="card"><p>No manageable accounts were returned.</p></article> :
          <div className="section-grid">
            {users.map((managedUser) => (
              <article className="card" key={managedUser.id}>
                <p className="eyebrow">{managedUser.role === "admin" ? "Admin" : "Member"}</p>
                <h3>{managedUser.email || "Email unavailable"}</h3>
                <p className="muted-note">Created: {managedUser.created_at ? new Date(managedUser.created_at).toLocaleDateString("en-GB", { timeZone: "UTC" }) : "Unknown"}</p>
                <p className="muted-note">Last sign in: {managedUser.last_sign_in_at ? new Date(managedUser.last_sign_in_at).toLocaleDateString("en-GB", { timeZone: "UTC" }) : "Never"}</p>
                <p className="muted-note">Email confirmed: {managedUser.email_confirmed_at ? "Yes" : "No"}</p>
                <div className="actions">
                  {isSuperAdmin && managedUser.id !== currentUserId && (
                    <button className="button secondary" type="button" disabled={busy} onClick={() => void toggleRole(managedUser)}>
                      {managedUser.role === "admin" ? "Change to Member" : "Grant Admin"}
                    </button>
                  )}
                  {(managedUser.role !== "admin" || isSuperAdmin) && managedUser.id !== currentUserId && (
                    <button className="button secondary" type="button" disabled={busy} onClick={() => void deleteUser(managedUser)}>Delete account</button>
                  )}
                </div>
              </article>
            ))}
          </div>}
      </section>
    </section>
  );
}
