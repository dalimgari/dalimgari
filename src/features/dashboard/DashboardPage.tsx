import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../services/supabase";

interface DashboardSection {
  id: string;
  title: string;
  description: string;
  permissions: string[];
}

const sections: DashboardSection[] = [
  {
    id: "overview",
    title: "Overview",
    description: "Dashboard access and account permissions.",
    permissions: ["content.view", "users.manage", "roles.manage", "settings.manage"],
  },
  {
    id: "hero",
    title: "Hero",
    description: "Homepage hero content.",
    permissions: ["content.view", "content.create", "content.edit", "content.delete"],
  },
  {
    id: "post",
    title: "Post",
    description: "Public posts.",
    permissions: ["content.view", "content.create", "content.edit", "content.delete"],
  },
  {
    id: "page",
    title: "Page",
    description: "Public pages and homepage page links.",
    permissions: ["content.view", "content.create", "content.edit", "content.delete"],
  },
  {
    id: "album",
    title: "Album",
    description: "Albums and gallery media.",
    permissions: ["content.view", "content.create", "content.edit", "content.delete"],
  },
  {
    id: "media-library",
    title: "Media Library",
    description: "Reusable media assets and attachment metadata.",
    permissions: ["content.view", "content.create", "content.edit", "content.delete"],
  },
  {
    id: "widget",
    title: "Widget",
    description: "Homepage widgets and visibility.",
    permissions: ["settings.manage"],
  },
  { id: "user", title: "User", description: "Account management.", permissions: ["users.manage"] },
  {
    id: "role",
    title: "Role",
    description: "Roles and permission assignments.",
    permissions: ["roles.manage"],
  },
  {
    id: "customization",
    title: "Customization",
    description: "Homepage ordering and appearance settings.",
    permissions: ["settings.manage"],
  },
  {
    id: "settings",
    title: "Settings",
    description: "Site-wide settings.",
    permissions: ["settings.manage"],
  },
  {
    id: "recycle-bin",
    title: "Recycle Bin",
    description: "Recoverable deleted content.",
    permissions: ["roles.manage"],
  },
];

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!supabase) {
        if (active) {
          setError("Supabase configuration is missing.");
          setLoading(false);
        }
        return;
      }
      try {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError || !data.user) throw new Error("Log in to access the dashboard.");
        const admin = String(data.user.app_metadata?.role ?? "").toLowerCase() === "admin";
        let granted: string[] = [];
        {
          const { data: permissionData, error: permissionError } =
            await supabase.rpc("get_my_permissions");
          if (permissionError && !admin) throw new Error("Your permissions could not be verified.");
          if (Array.isArray(permissionData))
            granted = permissionData.filter((value): value is string => typeof value === "string");
          if (!admin && granted.length === 0)
            throw new Error("This account is not allowed to access the dashboard.");
        }
        if (!active) return;
        setUserId(data.user.id);
        setIsAdmin(admin);
        setPermissions(granted);
      } catch (loadError) {
        if (active)
          setError(loadError instanceof Error ? loadError.message : "The dashboard could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p role="status">Checking permissions…</p>;
  if (error)
    return (
      <section className="notice-card">
        <h1>Dashboard</h1>
        <p role="alert">{error}</p>
      </section>
    );

  const allowed = sections.filter((section) => {
    if (section.id === "recycle-bin") return isAdmin;
    if (section.id === "user") return isAdmin && permissions.includes("roles.manage");
    if (section.id === "overview")
      return isAdmin || section.permissions.some((permission) => permissions.includes(permission));
    if (section.id === "page" || section.id === "media-library")
      return isAdmin || section.permissions.some((permission) => permissions.includes(permission));
    return section.permissions.some((permission) => permissions.includes(permission));
  });
  const current = allowed.find((section) => section.id === activeSection) ?? allowed[0];

  return (
    <section className="dashboard-page" aria-labelledby="dashboard-title">
      <h1 id="dashboard-title">Dashboard</h1>
      <p>
        Account: <code>{userId}</code>
      </p>
      <p>Role: {isAdmin ? "ADMIN" : "PERMISSION-BASED MEMBER"}</p>
      <nav className="dashboard-section-nav" aria-label="Dashboard sections">
        {allowed.map((section) => (
          <button
            key={section.id}
            type="button"
            aria-current={section.id === current?.id ? "page" : undefined}
            onClick={() => setActiveSection(section.id)}
          >
            {section.title}
          </button>
        ))}
      </nav>
      {current ? (
        <section className="notice-card" aria-labelledby="dashboard-section-title">
          <h2 id="dashboard-section-title">{current.title}</h2>
          <p>{current.description}</p>
          {current.id === "media-library" ? (
            <Link to="/dashboard/media-library">Open Media Library</Link>
          ) : null}
          {["hero", "post", "page", "album", "widget"].includes(current.id) ? (
            <Link to={"/dashboard/" + current.id}>Manage this section</Link>
          ) : null}
          {current.id === "recycle-bin" ? <Link to="/dashboard/recycle-bin">Open Recycle Bin</Link> : null}
          {current.id === "user" ? (
            <Link to="/dashboard/user">Manage users and role assignments</Link>
          ) : null}
          {current.id === "role" ? (
            <Link to="/dashboard/role">Manage roles and permissions</Link>
          ) : null}
          {["settings", "customization"].includes(current.id) ? (
            <Link to={"/dashboard/" + current.id}>Manage settings</Link>
          ) : null}
          <p>
            Full CRUD for this section is still being migrated; the legacy dashboard remains in production.
          </p>
        </section>
      ) : (
        <p>No dashboard sections are permitted for this account.</p>
      )}
    </section>
  );
}
