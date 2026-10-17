import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { MediaUpload } from "./media-upload";

export const metadata = { title: "Media Library" };
export const dynamic = "force-dynamic";

export default async function MediaLibraryPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("media_assets")
    .select("id,title,title_en,original_filename,mime_type,size_bytes,visibility,created_at,storage_bucket,storage_path")
    .order("created_at", { ascending: false })
    .limit(24);

  const assets = await Promise.all((data ?? []).map(async (asset) => {
    const { data: signed } = await supabase.storage
      .from(asset.storage_bucket)
      .createSignedUrl(asset.storage_path, 60);
    return { ...asset, previewUrl: signed?.signedUrl ?? null };
  }));

  return (
    <section>
      <p className="eyebrow">Content management</p>
      <h1>Media Library</h1>
      <p className="lead">Upload once, keep a title and file hash in the database, and reuse the asset in public or private content.</p>
      <article className="card">
        <h2>Upload media</h2>
        <MediaUpload />
      </article>
      <div className="actions">
        <Link className="button secondary" href="/dashboard">Dashboard</Link>
      </div>
      <section className="section">
        <h2>Stored assets</h2>
        {error && <p role="alert" className="form-error">Media assets could not be loaded.</p>}
        {!error && assets.length === 0 && <article className="card"><p>The Media Library is empty.</p></article>}
        <div className="section-grid">
          {assets.map((asset) => (
            <article className="card" key={asset.id}>
              <p className="eyebrow">{asset.visibility === "public" ? "Public" : "Private"}</p>
              <h3>{asset.title_en || asset.title}</h3>
              <p className="muted-note">{asset.original_filename}</p>
              <p className="muted-note">{asset.mime_type || "Unknown file type"} · {asset.size_bytes ? `${(asset.size_bytes / 1024 / 1024).toFixed(2)} MB` : "Size unavailable"}</p>
              {asset.previewUrl && <a className="button secondary" href={asset.previewUrl} target="_blank" rel="noopener noreferrer">Preview / open file</a>}
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
