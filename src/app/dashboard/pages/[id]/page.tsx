import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { updatePage } from "../actions";

export const metadata = { title: "Edit page" };
export const dynamic = "force-dynamic";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, { supabase }] = await Promise.all([params, requireAdmin()]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: page, error } = await supabase
    .from("pages")
    .select("id,title,title_en,url,content,content_en,visibility")
    .eq("id", id)
    .maybeSingle();

  if (error || !page) notFound();

  return (
    <section>
      <p className="eyebrow">Content management</p>
      <h1>Edit page</h1>
      <article className="card">
        <form className="form wide-form" action={updatePage}>
          <input type="hidden" name="id" value={page.id} />
          <label>Page title
            <input name="title" defaultValue={page.title_en || page.title} maxLength={180} required />
          </label>
          <label>Page URL slug
            <input name="url" defaultValue={page.url} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={100} required />
          </label>
          <label>Visibility
            <select name="visibility" defaultValue={page.visibility}>
              <option value="public">Public</option>
              <option value="private">Only Me (private)</option>
            </select>
          </label>
          <label>HTML content
            <textarea name="content" defaultValue={page.content_en || page.content} rows={14} maxLength={100000} required />
          </label>
          <button className="button" type="submit">Save changes</button>
        </form>
      </article>
    </section>
  );
}
