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
  { id: "overview", title: "Overview", description: "Dashboard access and account permissions.", permissions: ["content.view", "users.manage", "roles.manage", "settings.manage"] },
  { id: "hero", title: "Hero", description: "Homepage hero content.", permissions: ["content.view", "content.create", "content.edit", "content.delete"] },
  { id: "post", title: "Post", description: "Public posts.", permissions: ["content.view", "content.create", "content.edit", "content.delete"] },
  { id: "page", title: "Page", description: "Public pages and homepage page links.", permissions: ["content.view", "content.create", "content.edit", "content.delete"] },
  { id: "album", title: "Album", description: "Albums and gallery media.", permissions: ["content.view", "content.create", "content.edit", "content.delete"] },
  { id: "media-library", title: "Media Library", description: "Reusable media assets and attachment metadata.", permissions: ["content.view", "content.create", "content.edit", "content.delete"] },
  { id: "widget", title: "Widget", description: "Homepage widgets and visibility.", permissions: ["settings.manage"] },
  { id: "user", title: "User", description: "Account management.", permissions: ["users.manage"] },
  { id: "role", title: "Role", description: "Roles and permission assignments.", permissions: ["roles.manage"] },
  { id: "customization", title: "Customization", description: "Homepage ordering and appearance settings.", permissions: ["settings.manage"] },
  { id: "settings", title: "Settings", description: "Site-wide settings.", permissions: ["settings.manage"] },
  { id: "recycle-bin", title: "Recycle Bin", description: "Recoverable deleted content.", permissions: ["content.delete", "users.manage", "roles.manage", "settings.manage"] },
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
        if (active) { setError("Supabase configuration পাওয়া যায়নি।"); setLoading(false); }
        return;
      }
      try {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError || !data.user) throw new Error("ড্যাশবোর্ড দেখতে লগইন করতে হবে।");
        const admin = String(data.user.app_metadata?.role ?? "").toLowerCase() === "admin";
        let granted: string[] = [];
        if (!admin) {
          const { data: permissionData, error: permissionError } = await supabase.rpc("get_my_permissions");
          if (permissionError) throw new Error("আপনার permission যাচাই করা যায়নি।");
          if (Array.isArray(permissionData)) granted = permissionData.filter((value): value is string => typeof value === "string");
          if (granted.length === 0) throw new Error("এই অ্যাকাউন্টের ড্যাশবোর্ড ব্যবহারের অনুমতি নেই।");
        }
        if (!active) return;
        setUserId(data.user.id);
        setIsAdmin(admin);
        setPermissions(granted);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "ড্যাশবোর্ড লোড করা যায়নি।");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  if (loading) return <p role="status">অনুমতি যাচাই হচ্ছে…</p>;
  if (error) return <section className="notice-card"><h1>ড্যাশবোর্ড</h1><p role="alert">{error}</p></section>;

  const allowed = sections.filter((section) => isAdmin || section.permissions.some((permission) => permissions.includes(permission)));
  const current = allowed.find((section) => section.id === activeSection) ?? allowed[0];

  return (
    <section className="dashboard-page" aria-labelledby="dashboard-title">
      <h1 id="dashboard-title">ড্যাশবোর্ড</h1>
      <p>অ্যাকাউন্ট: <code>{userId}</code></p>
      <p>ভূমিকা: {isAdmin ? "ADMIN" : "PERMISSION-BASED MEMBER"}</p>
      <nav className="dashboard-section-nav" aria-label="ড্যাশবোর্ড বিভাগ">
        {allowed.map((section) => (
          <button key={section.id} type="button" aria-current={section.id === current?.id ? "page" : undefined} onClick={() => setActiveSection(section.id)}>
            {section.title}
          </button>
        ))}
      </nav>
      {current ? (
        <section className="notice-card" aria-labelledby="dashboard-section-title">
          <h2 id="dashboard-section-title">{current.title}</h2>
          <p>{current.description}</p>
          {current.id === "media-library" ? <Link to="/dashboard/media-library">Media Library খুলুন</Link> : null}
          {["hero", "post", "page", "album", "widget"].includes(current.id) ? <Link to={"/dashboard/" + current.id}>এই বিভাগ পরিচালনা করুন</Link> : null}
          <p>এই বিভাগের সম্পূর্ণ CRUD UI এখনো মাইগ্রেশনাধীন; legacy dashboard production-এ চালু আছে।</p>
        </section>
      ) : <p>এই অ্যাকাউন্টের জন্য কোনো dashboard section অনুমোদিত নয়।</p>}
    </section>
  );
}
