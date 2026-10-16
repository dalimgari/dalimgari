import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "../../services/supabase";
import { getCurrentUser } from "../../services/auth";

interface MediaAsset {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  alt_text: string | null;
  original_filename: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string | null;
  signedUrl: string | null;
}

function asTags(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ACCEPTED_TYPES =
  /^(image\/(jpeg|png|webp|gif|avif)|video\/(mp4|webm|quicktime)|audio\/(mpeg|mp4|ogg|wav)|application\/pdf)$/i;

export function MediaLibraryPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [altText, setAltText] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [canView, setCanView] = useState(false);
  const [canUpload, setCanUpload] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadAssets = useCallback(async () => {
    const client = supabase;
    if (!client) throw new Error("Supabase configuration is missing.");
    const { data, error: queryError } = await client
      .from("media_assets")
      .select(
        "id,title,description,tags,alt_text,original_filename,storage_bucket,storage_path,mime_type,size_bytes,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (queryError) throw queryError;

    const resolved = await Promise.all(
      (data ?? []).map(async (asset) => {
        const { data: signed, error: signError } = await client.storage
          .from(asset.storage_bucket)
          .createSignedUrl(asset.storage_path, 3600);
        return {
          ...asset,
          tags: asTags(asset.tags),
          signedUrl: signError ? null : signed.signedUrl,
        };
      }),
    );
    setAssets(resolved);
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        if (!supabase) throw new Error("Supabase configuration is missing.");
        const user = await getCurrentUser();
        if (!user) throw new Error("Log in to access the Media Library.");
        const isAdmin = String(user.app_metadata?.role ?? "").toLowerCase() === "admin";
        let permissions: string[] = [];
        if (!isAdmin) {
          const { data, error: permissionError } = await supabase.rpc("get_my_permissions");
          if (permissionError) throw new Error("Your permissions could not be verified.");
          if (Array.isArray(data))
            permissions = data.filter((value): value is string => typeof value === "string");
        }
        const view = isAdmin || permissions.includes("content.view");
        const upload = isAdmin || permissions.includes("content.create");
        if (!view) throw new Error("You do not have permission to access the Media Library.");
        if (!active) return;
        setCanView(view);
        setCanUpload(upload);
        await loadAssets();
      } catch (initError) {
        if (active)
          setError(initError instanceof Error ? initError.message : "The Media Library could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void init();
    return () => {
      active = false;
    };
  }, [loadAssets]);

  const uploadFile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!supabase || !file || !canUpload) return;
    setError("");
    setMessage("");
    if (!title.trim()) {
      setError("Enter a media title.");
      return;
    }
    if (!ACCEPTED_TYPES.test(file.type)) {
      setError("This file type is not supported. Choose an image, video, audio file, or PDF.");
      return;
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      setError("File size must be 25 MB or less.");
      return;
    }

    setUploading(true);
    let uploadedPath = "";
    let metadataSaved = false;
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Your session has expired. Please log in again.");
      const extension = file.name.match(/\.([a-zA-Z0-9]{1,10})$/)?.[1]?.toLowerCase() || "bin";
      uploadedPath = visibility + "/" + user.id + "/" + crypto.randomUUID() + "." + extension;
      const { error: storageError } = await supabase.storage
        .from("content-files")
        .upload(uploadedPath, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });
      if (storageError) throw storageError;

      const { error: metadataError } = await supabase.from("media_assets").insert({
        title: title.trim(),
        description: description.trim() || null,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        alt_text: altText.trim() || null,
        original_filename: file.name,
        storage_bucket: "content-files",
        storage_path: uploadedPath,
        mime_type: file.type,
        size_bytes: file.size,
        created_by: user.id,
      });
      if (metadataError) throw metadataError;
      metadataSaved = true;

      setMessage("File uploaded and metadata saved.");
      setTitle("");
      setDescription("");
      setTags("");
      setAltText("");
      setFile(null);
      form.reset();
      await loadAssets();
    } catch (uploadError) {
      if (uploadedPath && !metadataSaved) {
        await supabase.storage.from("content-files").remove([uploadedPath]);
      }
      setError(uploadError instanceof Error ? uploadError.message : "File upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const query = search.trim().toLowerCase();
  const filteredAssets = assets.filter((asset) =>
    [
      asset.title,
      asset.original_filename,
      asset.description,
      asset.alt_text,
      asset.tags.join(" "),
    ].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(query),
    ),
  );

  if (loading) return <p role="status">Checking Media Library permissions…</p>;
  if (!canView) return <p role="alert">{error || "Access denied."}</p>;

  return (
    <section className="media-library-page" aria-labelledby="media-library-title">
      <h1 id="media-library-title">Media Library</h1>
      {error ? <p role="alert">{error}</p> : null}
      {message ? <p role="status">{message}</p> : null}
      {canUpload ? (
        <form className="media-upload-form" onSubmit={(event) => void uploadFile(event)}>
          <h2>Upload new media</h2>
          <label htmlFor="media-file">File (maximum 25 MB)</label>
          <input
            id="media-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/ogg,audio/wav,application/pdf"
            required
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <label htmlFor="media-title">Title</label>
          <input
            id="media-title"
            required
            maxLength={180}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <label htmlFor="media-description">Description</label>
          <textarea
            id="media-description"
            rows={3}
            maxLength={2000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <label htmlFor="media-tags">Tags (comma-separated)</label>
          <input
            id="media-tags"
            maxLength={500}
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
          <label htmlFor="media-alt">Image alt text</label>
          <input
            id="media-alt"
            maxLength={300}
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
          />
          <label htmlFor="media-visibility">Storage path visibility</label>
          <select
            id="media-visibility"
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as "private" | "public")}
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
          <p>
            Choosing a Private/Public path does not change Storage policy; RLS and bucket policies determine access.
          </p>
          <button type="submit" disabled={uploading || !file}>
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </form>
      ) : (
        <p>Your account does not have upload permission.</p>
      )}

      <section aria-labelledby="media-list-title">
        <h2 id="media-list-title">Stored media ({assets.length})</h2>
        <label htmlFor="media-search">Search media</label>
        <input
          id="media-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {filteredAssets.length === 0 ? <p>No media found.</p> : null}
        <div className="media-library-grid">
          {filteredAssets.map((asset) => (
            <article className="media-library-card" key={asset.id}>
              {asset.signedUrl && (asset.mime_type ?? "").startsWith("image/") ? (
                <img
                  src={asset.signedUrl}
                  alt={asset.alt_text || asset.title}
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
              {asset.signedUrl && (asset.mime_type ?? "").startsWith("video/") ? (
                <video src={asset.signedUrl} controls preload="metadata" />
              ) : null}
              <h3>{asset.title}</h3>
              <p>{asset.original_filename}</p>
              {asset.description ? <p>{asset.description}</p> : null}
              {asset.tags.length ? <p>{asset.tags.join(", ")}</p> : null}
              <small>
                {Math.ceil((asset.size_bytes ?? 0) / 1024)} KB · {asset.mime_type}
              </small>
              {!asset.signedUrl ? <p>Preview unavailable under current Storage policy.</p> : null}
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
