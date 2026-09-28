import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./Admin.css";
import PostsManager from "./PostsManager";
import PagesManager from "./PagesManager";
import UsersManager from "./UsersManager";
import HomeTabsManager from "./HomeTabsManager";
import LinksManager from "./LinksManager";
import CustomizationManager from "./CustomizationManager";
import GalleryManager from "./GalleryManager";

const MODULES = [
  ["website-information", "Website Information"],
  ["posts", "Post Management"],
  ["photos", "Photo Management"],
  ["videos", "Video Management"],
  ["pages", "Page Management"],
  ["tabs", "Tab Management"],
  ["links", "Link Management"],
  ["users", "Users Management"],
  ["admin-information", "Admin Information"]
];

function Admin() {
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
            href="/"
          >
            Back to website
          </a>
        </form>
      </main>
    );
  }

  if (page === "website-information") {
    return <CustomizationManager />;
  }

  if (page === "photo-management") {
    return <GalleryManager />;
  }

  if (page === "posts") {
    return (
      <PostsManager
        onBack={() => setPage("dashboard")}
      />
    );
  }

  if (page === "pages") {
    return (
      <PagesManager
        onBack={() => setPage("dashboard")}
      />
    );
  }

  if (page === "links") {
    return <LinksManager />;
  }

  if (page === "tabs") {
    return (
      <HomeTabsManager
        onBack={() => setPage("dashboard")}
      />
    );
  }

  if (page === "users") {
    return (
      <UsersManager
        onBack={() => setPage("dashboard")}
      />
    );
  }

  const placeholderMap = {
    "website-information": "Website Information",
    photos: "Photo Management",
    videos: "Video Management",
    links: "Link Management",
    "admin-information": "Admin Information"
  };

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
          <a href="/">
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

export default Admin;
