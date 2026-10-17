import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");
  if (user.app_metadata?.role !== "admin") redirect("/profile");

  const [pages, albums, media, profiles] = await Promise.all([
    supabase.from("pages").select("id", { count: "exact", head: true }),
    supabase.from("albums").select("id", { count: "exact", head: true }),
    supabase.from("media_assets").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Pages", value: pages.count, href: "/pages" },
    { label: "Albums", value: albums.count, href: "/albums" },
    { label: "Media assets", value: media.count, href: "/media" },
    { label: "Member profiles", value: profiles.count, href: "/members" },
  ];

  return (
    <section>
      <p className="eyebrow">Administrator access</p>
      <h1>Dashboard</h1>
      <p className="lead">A protected overview. Content management modules will be added after the schema and role policies pass integration tests.</p>
      <div className="section-grid">
        {stats.map((stat) => (
          <article className="card" key={stat.label}>
            <p>{stat.label}</p>
            <h2>{stat.value ?? "—"}</h2>
          </article>
        ))}
      </div>
      <p className="muted-note">Only a server-verified account with the trusted Admin role can access this page. The navigation visibility is only a convenience; authorization is enforced on the server.</p>
    </section>
  );
}
