import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminInformation({ onBack }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadAdminInformation();
  }, []);

  async function loadAdminInformation() {
    setLoading(true);
    setMessage("");

    const {
      data: { user: currentUser },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !currentUser) {
      setMessage(userError?.message || "Admin account not found.");
      setLoading(false);
      return;
    }

    setUser(currentUser);

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (error) {
      setMessage(error.message);
    } else {
      setRole(data?.role || "user");
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="admin-page">
        <section className="admin-content">
          <p>Loading admin information...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">Administration</p>
          <h1>Admin Information</h1>
        </div>

        <button type="button" onClick={onBack}>
          Dashboard
        </button>
      </header>

      <section className="admin-content">
        {message && (
          <div className="admin-error">
            {message}
          </div>
        )}

        {user && (
          <div className="admin-module-grid">
            <div className="admin-module">
              <strong>Account Email</strong>
              <span>{user.email || "Not available"}</span>
            </div>

            <div className="admin-module">
              <strong>Account ID</strong>
              <span>{user.id}</span>
            </div>

            <div className="admin-module">
              <strong>Role</strong>
              <span>{role}</span>
            </div>

            <div className="admin-module">
              <strong>Authentication Provider</strong>
              <span>
                {user.app_metadata?.provider || "email"}
              </span>
            </div>

            <div className="admin-module">
              <strong>Account Created</strong>
              <span>
                {user.created_at
                  ? new Date(user.created_at).toLocaleString()
                  : "Not available"}
              </span>
            </div>

            <div className="admin-module">
              <strong>Last Sign In</strong>
              <span>
                {user.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleString()
                  : "Not available"}
              </span>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
