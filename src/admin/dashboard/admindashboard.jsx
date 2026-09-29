import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseclient";
import "./admindashboard.css";
import PostManager from "../module/posts/postmanager";
import PageManager from "../module/pages/pagemanager";
import UserManager from "../module/users/usermanager";
import TabManager from "../module/tabs/tabmanager";
import LinkManager from "../module/links/linkmanager";
import WebsiteManager from "../module/website/websitemanager";
import PhotoManager from "../module/photos/photomanager";
import VideoManager from "../module/videos/videomanager";

const MODULES = [
  ["website-information", "Website Information"],
  ["posts", "Post Management"],
  ["photos", "Photo Management"],
  ["videos", "Video Management"],
  ["pages", "Page Management"],
  ["tabs", "Tab Management"],
  ["links", "Link Management"],
  ["users", "User Information"],
  ["admin-information", "Admin Information"],
  ["analytics", "Analytics"]
];

function AdminAccountPanel({ onBack, onLogout }) {
  const [admin, setAdmin] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAdminInformation();
  }, []);

  async function loadAdminInformation() {
    const {
      data: { user: currentUser },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      setError(authError?.message || "Admin account not found.");
      return;
    }

    const { data, error: adminError } = await supabase
      .from("AdminInformation")
      .select(
        "name, photo_url, urls, role, authentication_provider, account_created, last_sign_in"
      )
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (adminError) {
      setError(adminError.message);
      return;
    }

    setAdmin({
      ...data,
      email: currentUser.email || null,
      user_id: currentUser.id
    });
  }

  if (page === "analytics") {
    return (
      <div className="admin-dashboard">
        <Analytics />
      </div>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">Administration</p>
          <h1>Admin Information</h1>
        </div>

        <div className="admin-header-actions">
          <button type="button" onClick={onBack}>
            Dashboard
          </button>

          <button type="button" onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </header>

      <section className="admin-content">
        {error && <div className="admin-error">{error}</div>}

        {admin && (
          <div className="admin-module-grid">
            <div className="admin-module">
              <strong>Name</strong>
              <span>{admin.name || "Not available"}</span>
            </div>

            <div className="admin-module">
              <strong>Account Email</strong>
              <span>{admin.email || "Not available"}</span>
            </div>

            <div className="admin-module">
              <strong>Account ID</strong>
              <span>{admin.user_id}</span>
            </div>

            <div className="admin-module">
              <strong>Role</strong>
              <span>{admin.role || "admin"}</span>
            </div>

            <div className="admin-module">
              <strong>Authentication Provider</strong>
              <span>
                {admin.authentication_provider || "email"}
              </span>
            </div>

            <div className="admin-module">
              <strong>Account Created</strong>
              <span>
                {admin.account_created
                  ? new Date(admin.account_created).toLocaleString()
                  : "Not available"}
              </span>
            </div>

            <div className="admin-module">
              <strong>Last Sign In</strong>
              <span>
                {admin.last_sign_in
                  ? new Date(admin.last_sign_in).toLocaleString()
                  : "Not available"}
              </span>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default function AdminManager() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [accountEnabled, setAccountEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    checkSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);

      if (!newSession) {
        setRole(null);
        setAccountEnabled(true);
        return;
      }

      loadUserRole(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserRole(currentSession) {
    const { data } = await supabase
      .from("UserInformation")
      .select("role, account_enabled")
      .eq("user_id", currentSession.user.id)
      .eq("record_type", "user")
      .maybeSingle();

    setRole(data?.role || "user");
    setAccountEnabled(data?.account_enabled !== false);
  }

  async function checkSession() {
    const { data } = await supabase.auth.getSession();

    setSession(data.session);

    if (data.session) {
      await loadUserRole(data.session);
    }

    setLoading(false);
  }

  async function login(event) {
    event.preventDefault();
    setLoginError("");

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

    if (error) {
      setLoginError(error.message);
      return;
    }

    if (!data.session) {
      setLoginError("Login failed.");
      return;
    }

    const { data: roleData, error: roleError } =
      await supabase
        .from("UserInformation")
        .select("role, account_enabled")
        .eq("user_id", data.session.user.id)
        .eq("record_type", "user")
        .maybeSingle();

    if (
      roleError ||
      roleData?.role !== "admin" ||
      roleData?.account_enabled === false
    ) {
      await supabase.auth.signOut();
      setSession(null);
      setRole(null);

      setLoginError(
        roleData?.account_enabled === false
          ? "This account is disabled."
          : "This account does not have admin access."
      );

      return;
    }

    setSession(data.session);
    setRole("admin");
    setAccountEnabled(true);
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
    setAccountEnabled(true);
    setPage("dashboard");
  }

  function openModule(module) {
    if (module === "analytics") {
      setPage("analytics");
      return;
    }

    setPage(module);
  }

  if (loading) {
    return <div className="admin-loading">Loading...</div>;
  }

  if (session && (!accountEnabled || role !== "admin")) {
    return (
      <main className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-logo">D</div>

          <p className="admin-eyebrow">Administration</p>

          <h1>Access Denied</h1>

          <p className="admin-muted">
            This account does not have administrator access.
          </p>

          <button type="button" onClick={logout}>
            Sign Out
          </button>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="admin-login-page">
        <form className="admin-login-card" onSubmit={login}>
          <div className="admin-logo">D</div>

          <p className="admin-eyebrow">Administration</p>

          <h1>Admin Login</h1>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {loginError && (
            <div className="admin-error">{loginError}</div>
          )}

          <button
            className="admin-primary-button"
            type="submit"
          >
            Sign In
          </button>

          <a
            className="admin-back-link"
            href={import.meta.env.BASE_URL}
          >
            Back to website
          </a>
        </form>
      </main>
    );
  }

  if (page === "website-information") {
    return <WebsiteManager />;
  }

  if (page === "posts") {
    return (
      <PostManager
        onBack={() => setPage("dashboard")}
      />
    );
  }

  if (page === "photos") {
    return <PhotoManager />;
  }

  if (page === "videos") {
    return <VideoManager />;
  }

  if (page === "pages") {
    return (
      <PageManager
        onBack={() => setPage("dashboard")}
      />
    );
  }

  if (page === "tabs") {
    return (
      <TabManager
        onBack={() => setPage("dashboard")}
      />
    );
  }

  if (page === "links") {
    return <LinkManager />;
  }

  if (page === "users") {
    return (
      <UserManager
        onBack={() => setPage("dashboard")}
      />
    );
  }

  if (page === "admin-information") {
    return (
      <AdminAccountPanel
        onBack={() => setPage("dashboard")}
        onLogout={logout}
      />
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">Administration</p>
          <h1>Dashboard</h1>
        </div>

        <div className="admin-header-actions">
          <a href={import.meta.env.BASE_URL}>
            View Website
          </a>

          <button type="button" onClick={logout}>
            Sign Out
          </button>
        </div>
      </header>

      <section className="admin-content">
        <div className="admin-welcome">
          <h2>Community Management</h2>
          <p>Select a management module.</p>
        </div>

        <div className="admin-module-grid">
          {MODULES.map(([key, title]) => (
            <button
              key={key}
              type="button"
              className="admin-module"
              onClick={() => openModule(key)}
            >
              <strong>{title}</strong>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
