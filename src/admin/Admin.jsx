import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./Admin.css";
import NewsManager from "./NewsManager";
import EventsManager from "./EventsManager";
import SettingsManager from "./SettingsManager";
import PagesManager from "./PagesManager";
import GalleryManager from "./GalleryManager";
import MessagesManager from "./MessagesManager";
import AnnouncementsManager from "./AnnouncementsManager";
import PostsManager from "./PostsManager";
import DocumentsManager from "./DocumentsManager";
import UsersManager from "./UsersManager";

function Admin() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [page, setPage] = useState("dashboard");
  const [stats, setStats] = useState({
    news: 0,
    events: 0,
    gallery: 0,
    messages: 0
  });

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
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", currentSession.user.id)
      .maybeSingle();

    const currentRole = roleData?.role || "user";
    setRole(currentRole);

    if (currentRole === "admin") {
      await loadStats();
    }
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

      if (roleData?.role === "admin") {
        await loadStats();
      }
    }

    setLoading(false);
  }

  async function login(event) {
    event.preventDefault();
    setLoginError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setLoginError(error.message);
      return;
    }

    if (data.session) {
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id)
        .maybeSingle();

      if (roleError || roleData?.role !== "admin") {
        await supabase.auth.signOut();
        setSession(null);
        setRole(null);
        setLoginError("This account does not have admin access.");
        return;
      }

      setSession(data.session);
      setRole("admin");
      await loadStats();
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setPage("dashboard");
  }

  async function loadStats() {
    const [news, events, gallery, messages, documents, announcements] =
      await Promise.all([
        supabase.from("news").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("gallery").select("*", { count: "exact", head: true }),
        supabase
          .from("contact_messages")
          .select("*", { count: "exact", head: true }),
        supabase.from("documents").select("*", { count: "exact", head: true }),
        supabase
          .from("announcements")
          .select("*", { count: "exact", head: true })
      ]);

    setStats({
      news: news.count || 0,
      events: events.count || 0,
      gallery: gallery.count || 0,
      messages: messages.count || 0,
      documents: documents.count || 0,
      announcements: announcements.count || 0
    });
  }

  if (loading) {
    return <div className="admin-loading">Loading...</div>;
  }

  if (session && role !== "admin") {
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

          <p className="admin-muted">
            Sign in to manage the community platform.
          </p>

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
            <div className="admin-error">
              {loginError}
            </div>
          )}

          <button className="admin-primary-button" type="submit">
            Sign In
          </button>

          <a className="admin-back-link" href="/">
            Back to website
          </a>
        </form>
      </main>
    );
  }

  if (page === "messages") {
    return (
      <main className="admin-page">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">Administration</p>
            <h1>Messages</h1>
          </div>

          <div className="admin-header-actions">
            <button onClick={() => setPage("dashboard")}>
              Dashboard
            </button>

            <button onClick={logout}>
              Sign Out
            </button>
          </div>
        </header>

        <section className="admin-content">
          <MessagesManager />
        </section>
      </main>
    );
  }

  if (page === "gallery") {
    return (
      <main className="admin-page">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">Administration</p>
            <h1>Gallery Management</h1>
          </div>

          <div className="admin-header-actions">
            <button onClick={() => setPage("dashboard")}>
              Dashboard
            </button>

            <button onClick={logout}>
              Sign Out
            </button>
          </div>
        </header>

        <section className="admin-content">
          <GalleryManager />
        </section>
      </main>
    );
  }

  if (page === "events") {
    return (
      <main className="admin-page">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">Administration</p>
            <h1>Events Management</h1>
          </div>

          <div className="admin-header-actions">
            <button onClick={() => setPage("dashboard")}>
              Dashboard
            </button>

            <button onClick={logout}>
              Sign Out
            </button>
          </div>
        </header>

        <section className="admin-content">
          <EventsManager />
        </section>
      </main>
    );
  }

  if (page === "news") {
    return (
      <main className="admin-page">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">Administration</p>
            <h1>News Management</h1>
          </div>

          <div className="admin-header-actions">
            <button onClick={() => setPage("dashboard")}>
              Dashboard
            </button>

            <button onClick={logout}>
              Sign Out
            </button>
          </div>
        </header>

        <section className="admin-content">
          <NewsManager />
        </section>
      </main>
    );
  }

  if (page === "documents") {
    return <DocumentsManager onBack={() => setPage("dashboard")} />;
  }

  if (page === "announcements") {
    return <AnnouncementsManager onBack={() => setPage("dashboard")} />;
  }

  if (page === "posts") {
    return <PostsManager onBack={() => setPage("dashboard")} />;
  }

  if (page === "pages") return <PagesManager onBack={() => setPage("dashboard")} />;

  if (page === "users") {
    return <UsersManager onBack={() => setPage("dashboard")} />;
  }

  if (page === "settings") {
    return (
      <main className="admin-page">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">Administration</p>
            <h1>Settings</h1>
          </div>
          <div className="admin-header-actions">
            <button onClick={() => setPage("dashboard")}>Dashboard</button>
            <button onClick={logout}>Sign Out</button>
          </div>
        </header>
        <section className="admin-content">
          <SettingsManager />
        </section>
      </main>
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
          <a href="/">View Website</a>

          <button onClick={logout}>
            Sign Out
          </button>
        </div>
      </header>

      <section className="admin-content">
        <div className="admin-welcome">
          <h2>Community Management</h2>

          <p>
            Manage published content and community information from one place.
          </p>
        </div>

        <div className="admin-stat-grid">
          <div className="admin-stat-card">
            <span>News</span>
            <strong>{stats.news}</strong>
          </div>

          <div className="admin-stat-card">
            <span>Events</span>
            <strong>{stats.events}</strong>
          </div>

          <div className="admin-stat-card">
            <span>Gallery</span>
            <strong>{stats.gallery}</strong>
          </div>

          <div className="admin-stat-card">
            <span>Messages</span>
            <strong>{stats.messages}</strong>
          </div>

          <div className="admin-stat-card">
            <span>Documents</span>
            <strong>{stats.documents}</strong>
          </div>

          <div className="admin-stat-card">
            <span>Announcements</span>
            <strong>{stats.announcements}</strong>
          </div>
        </div>

        <div className="admin-module-grid">
          <button
            type="button"
            onClick={() => setPage("news")}
            className="admin-module"
          >
            <strong>News</strong>
            <span>Manage community news</span>
          </button>

          <button
            type="button"
            onClick={() => setPage("events")}
            className="admin-module"
          >
            <strong>Events</strong>
            <span>Manage community events</span>
          </button>

          <button
            type="button"
            onClick={() => setPage("gallery")}
            className="admin-module"
          >
            <strong>Gallery</strong>
            <span>Manage media</span>
          </button>

          <button
            type="button"
            onClick={() => setPage("messages")}
            className="admin-module"
          >
            <strong>Messages</strong>
            <span>View contact messages</span>
          </button>

          <button
            type="button"
            onClick={() => setPage("documents")}
            className="admin-module"
          >
            <strong>Documents</strong>
            <span>Manage website documents</span>
          </button>

          <button
            type="button"
            onClick={() => setPage("announcements")}
            className="admin-module"
          >
            <strong>Announcements</strong>
            <span>Manage announcements</span>
          </button>

          <button
            type="button"
            onClick={() => setPage("posts")}
            className="admin-module"
          >
            <strong>Posts</strong>
            <span>Manage community posts</span>
          </button>

          <button
            type="button"
            onClick={() => setPage("pages")}
            className="admin-module"
          >
            <strong>Pages</strong>
            <span>Manage website pages</span>
          </button>

          <button onClick={() => setPage("users")} className="admin-module">
            <strong>Users & Permissions</strong>
            <span>Manage users and specific permissions</span>
          </button>

          <button onClick={() => setPage("settings")} className="admin-module">
            <strong>Settings</strong>
            <span>Manage website settings</span>
          </button>
        </div>
      </section>
    </main>
  );
}

export default Admin;
