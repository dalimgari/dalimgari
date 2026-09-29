import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./AdminDashboard.css";
import PostManager from "./PostManager";
import PageManager from "./PageManager";
import UserManager from "./UserManager";
import TabManager from "./TabManager";
import LinkManager from "./LinkManager";
import WebsiteManager from "./WebsiteManager";
import PhotoManager from "./PhotoManager";
import VideoManager from "./VideoManager";

const MODULES = [
  ["website-information", "Website Information"],
  ["posts", "Post Management"],
  ["photos", "Photo Management"],
  ["videos", "Video Management"],
  ["pages", "Page Management"],
  ["tabs", "Tab Management"],
  
  ["users", "User Information"],
  ["admin-information", "Admin Information"]
];

function AdminAccountPanel({ onBack }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      if (error || !currentUser) {
        setMessage(error?.message || "Admin account not found.");
        return;
      }
      setUser(currentUser);
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", currentUser.id).maybeSingle();
      setRole(data?.role || "user");
    })();
  }, []);

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div><p className="admin-eyebrow">Administration</p><h1>Admin Information</h1></div>
        <button type="button" onClick={onBack}>Dashboard</button>
      </header>
      <section className="admin-content">
        {message && <div className="admin-error">{message}</div>}
        {user && <div className="admin-module-grid">
          <div className="admin-module"><strong>Account Email</strong><span>{user.email || "Not available"}</span></div>
          <div className="admin-module"><strong>Account ID</strong><span>{user.id}</span></div>
          <div className="admin-module"><strong>Role</strong><span>{role}</span></div>
          <div className="admin-module"><strong>Authentication Provider</strong><span>{user.app_metadata?.provider || "email"}</span></div>
          <div className="admin-module"><strong>Account Created</strong><span>{user.created_at ? new Date(user.created_at).toLocaleString() : "Not available"}</span></div>
          <div className="admin-module"><strong>Last Sign In</strong><span>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Not available"}</span></div>
        </div>}
      </section>
    </main>
  );
}

export default function AdminManager() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
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
        return;
      }

      loadUserRole(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserRole(currentSession) {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", currentSession.user.id)
      .maybeSingle();

    setRole(data?.role || "user");
  }

  async function checkSession() {
    const { data } = await supabase.auth.getSession();

    setSession(data.session);

    if (data.session) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id)
        .maybeSingle();

      setRole(roleData?.role || "user");
    }

    setLoading(false);
  }

  async function login(event) {
    event.preventDefault();
    setLoginError("");

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
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
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id)
        .maybeSingle();

    if (roleError || roleData?.role !== "admin") {
      await supabase.auth.signOut();
      setSession(null);
      setRole(null);
      setLoginError(
        "This account does not have admin access."
      );
      return;
    }

    setSession(data.session);
    setRole("admin");
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
    setPage("dashboard");
  }

  function openModule(module) {
    setPage(module);
  }

  function renderPlaceholder(title) {
    return (
      <main className="admin-page">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">
              Administration
            </p>
            <h1>{title}</h1>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              onClick={() => setPage("dashboard")}
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={logout}
            >
              Sign Out
            </button>
          </div>
        </header>

        <section className="admin-content">
          <div className="admin-welcome">
            <h2>{title}</h2>
            <p>Module is ready for configuration.</p>
          </div>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="admin-loading">
        Loading...
      </div>
    );
  }

  if (session && role !== "admin") {
    return (
      <main className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-logo">D</div>

          <p className="admin-eyebrow">
            Administration
          </p>

          <h1>Access Denied</h1>

          <p className="admin-muted">
            This account does not have administrator access.
          </p>

          <button
            type="button"
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="admin-login-page">
        <form
          className="admin-login-card"
          onSubmit={login}
        >
          <div className="admin-logo">D</div>

          <p className="admin-eyebrow">
            Administration
          </p>

          <h1>Admin Login</h1>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
              required
            />
          </label>

          {loginError && (
            <div className="admin-error">
              {loginError}
            </div>
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

  if (page === "photos") {
    return <PhotoManager />;
  }

  if (page === "posts") {
    return (
      <PostManager
        onBack={() => setPage("dashboard")}
      />
    );
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

  if (page === "links") {
    return <LinkManager />;
  }

  if (page === "tabs") {
    return (
      <TabManager
        onBack={() => setPage("dashboard")}
      />
    );
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
      />
    );
  }

  const placeholderMap = {};

  if (placeholderMap[page]) {
    return renderPlaceholder(
      placeholderMap[page]
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">
            Administration
          </p>

          <h1>Dashboard</h1>
        </div>

        <div className="admin-header-actions">
          <a href={import.meta.env.BASE_URL}>
            View Website
          </a>

          <button
            type="button"
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      </header>

      <section className="admin-content">
        <div className="admin-welcome">
          <h2>Community Management</h2>
          <p>
            Select a management module.
          </p>
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


