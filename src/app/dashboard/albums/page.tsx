import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAlbum } from "./actions";

export const metadata = { title: "Manage albums" };
export const dynamic = "force-dynamic";

export default async function ManageAlbumsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ supabase }, query] = await Promise.all([requireAdmin(), searchParams]);
  const [albumResult, mediaResult] = await Promise.all([
    supabase.from("albums").select("id,title,title_en,url,visibility,description,description_en,updated_at").order("updated_at", { ascending: false }).limit(200),
    supabase.from("media_assets").select("id,title,title_en,visibility,mime_type,size_bytes").order("created_at", { ascending: false }).limit(100),
  ]);
  const albums = albumResult.data ?? [];
  const media = mediaResult.data ?? [];
  const notice = query.created ? "Album created." : query.updated ? "Album updated." : query.error ? "The request could not be completed. For public albums, select only public media assets." : "";

  return (
    <section>
      <p className="eyebrow">Content management</p>
      <h1>Albums</h1>
      <p className="lead">Create albums and link existing Media Library assets. Public albums can only contain public assets.</p>
      {notice && <p role="status" className={query.error ? "form-error" : "form-success"}>{notice}</p>}
      {albumResult.error && <p role="alert" className="form-error">Albums could not be loaded.</p>}
      <article className="card">
        <h2>Create album</h2>
        <form className="form wide-form" action={createAlbum}>
          <label>Album title
            <input name="title" maxLength={180} required />
          </label>
          <label>Album URL slug
            <input name="url" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={100} placeholder="village-events" required />
          </label>
          <label>Description
            <textarea name="description" rows={3} maxLength={1000} />
          </label>
          <label>Visibility
            <select name="visibility" defaultValue="public">
              <option value="public">Public</option>
              <option value="private">Private (admin-only)</option>
            </select>
          </label>
          <fieldset className="media-picker">
            <legend>Attach media assets</legend>
            {media.length === 0 ? <p>No media assets are available. Upload files in the Media Library first.</p> :
              media.map((asset) => (
                <label className="inline-checkbox" key={asset.id}>
                  <input type="checkbox" name="mediaIds" value={asset.id} />
                  <span>{asset.title_en || asset.title} <small>({asset.visibility})</small></span>
                </label>
              ))}
          </fieldset>
          <button className="button" type="submit">Create album</button>
        </form>
      </article>
      <section className="section">
        <h2>Existing albums</h2>
        {albums.length === 0 && <article className="card"><p>No albums have been created.</p></article>}
        <div className="section-grid">
          {albums.map((album) => (
            <article className="card" key={album.id}>
              <p className="eyebrow">{album.visibility === "public" ? "Public" : "Private"}</p>
              <h3>{album.title_en || album.title}</h3>
              <p className="muted-note">/gallery/{album.url}</p>
              <div className="actions">
                <Link className="button secondary" href={`/dashboard/albums/${album.id}`}>Edit album</Link>
                {album.visibility === "public" && <Link className="button secondary" href={`/gallery/${album.url}`}>View gallery</Link>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
