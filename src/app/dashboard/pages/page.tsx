import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createPage } from "./actions";

export const metadata = { title: "Manage pages" };
export const dynamic = "force-dynamic";

export default async function ManagePagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ supabase }, query] = await Promise.all([requireAdmin(), searchParams]);
  const { data, error } = await supabase
    .from("pages")
    .select("id,title,title_en,url,visibility,updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  const notice = query.created ? "Page created." :
    query.updated ? "Page updated." :
    query.recycled ? "Page moved to Recycle Bin." :
    query.error ? "The request could not be completed. Check the page fields and try again." : "";

  return (
    <section>
      <p className="eyebrow">Content management</p>
      <h1>Pages</h1>
      <p className="lead">Create and edit database-managed pages. HTML is sanitized on the server before it is saved and rendered.</p>
      {notice && <p role="status" className={query.error ? "form-error" : "form-success"}>{notice}</p>}
      <article className="card">
        <h2>Create page</h2>
        <form className="form wide-form" action={createPage}>
          <label>Page title
            <input name="title" maxLength={180} required />
          </label>
          <label>Page URL slug
            <input name="url" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={100} placeholder="village-history" required />
          </label>
          <label>Visibility
            <select name="visibility" defaultValue="public">
              <option value="public">Public</option>
              <option value="private">Only Me (private)</option>
            </select>
          </label>
          <label>HTML content
            <textarea name="content" rows={10} maxLength={100000} required />
          </label>
          <button className="button" type="submit">Create page</button>
        </form>
      </article>
      <div className="actions">
        <Link className="button secondary" href="/dashboard/recycle-bin">Recycle Bin</Link>
      </div>
      <section className="section">
        <h2>Existing pages</h2>
        {error && <p role="alert" className="form-error">Pages could not be loaded.</p>}
        {!error && (!data || data.length === 0) && <article className="card"><p>No pages found.</p></article>}
        <div className="section-grid">
          {(data ?? []).map((page) => (
            <article className="card" key={page.id}>
              <p className="eyebrow">{page.visibility === "private" ? "Only Me" : "Public"}</p>
              <h3>{page.title_en || page.title}</h3>
              <p className="muted-note">/p/{page.url}</p>
              <div className="actions">
                <Link className="button secondary" href={`/dashboard/pages/${page.id}`}>Edit</Link>
                {page.visibility === "public" && <Link className="button secondary" href={`/p/${page.url}`}>View</Link>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
