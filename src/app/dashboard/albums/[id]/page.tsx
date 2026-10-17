import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { updateAlbum } from "../actions";

export const metadata = { title: "Edit album" };
export const dynamic = "force-dynamic";

export default async function EditAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { supabase }] = await Promise.all([params, requireAdmin()]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [albumResult, mediaResult, linksResult] = await Promise.all([
    supabase.from("albums").select("id,title,title_en,url,visibility,description,description_en").eq("id", id).maybeSingle(),
    supabase.from("media_assets").select("id,title,title_en,visibility,mime_type,size_bytes").order("created_at", { ascending: false }).limit(100),
    supabase.from("media_links").select("media_id").eq("source_table", "albums").eq("source_id", id),
  ]);
  const album = albumResult.data;
  if (albumResult.error || !album) notFound();
  const media = mediaResult.data ?? [];
  const linkedIds = new Set((linksResult.data ?? []).map((link) => link.media_id));

  return (
    <section>
      <p className="eyebrow">Content management</p>
      <h1>Edit album</h1>
      <article className="card">
        <form className="form wide-form" action={updateAlbum}>
          <input type="hidden" name="id" value={album.id} />
          <label>Album title
            <input name="title" defaultValue={album.title_en || album.title} maxLength={180} required />
          </label>
          <label>Album URL slug
            <input name="url" defaultValue={album.url} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={100} required />
          </label>
          <label>Description
            <textarea name="description" defaultValue={album.description_en || album.description || ""} rows={3} maxLength={1000} />
          </label>
          <label>Visibility
            <select name="visibility" defaultValue={album.visibility}>
              <option value="public">Public</option>
              <option value="private">Private (admin-only)</option>
            </select>
          </label>
          <fieldset className="media-picker">
            <legend>Attached media</legend>
            {media.map((asset) => (
              <label className="inline-checkbox" key={asset.id}>
                <input type="checkbox" name="mediaIds" value={asset.id} defaultChecked={linkedIds.has(asset.id)} />
                <span>{asset.title_en || asset.title} <small>({asset.visibility})</small></span>
              </label>
            ))}
          </fieldset>
          <button className="button" type="submit">Save album</button>
        </form>
      </article>
    </section>
  );
}
