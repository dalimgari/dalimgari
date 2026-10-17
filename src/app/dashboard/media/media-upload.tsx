"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "audio/mpeg", "audio/mp4", "application/pdf",
]);

async function sha256(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeFilename(name: string) {
  return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "upload";
}

export function MediaUpload() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const title = String(form.get("title") ?? "").trim();
    const visibility = String(form.get("visibility") ?? "private");
    const selected = form.get("file");
    const file = selected instanceof File ? selected : null;

    if (!title || title.length > 180 || !file) {
      setError("Enter a title and choose a file.");
      setBusy(false);
      return;
    }
    if (!ALLOWED_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_FILE_SIZE) {
      setError("Unsupported file type or size. Allowed: images, MP4 video, MP3/M4A audio, and PDF up to 25 MB.");
      setBusy(false);
      return;
    }
    if (visibility !== "public" && visibility !== "private") {
      setError("Choose a valid visibility setting.");
      setBusy(false);
      return;
    }

    let uploadedPath: string | null = null;
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user || user.app_metadata?.role !== "admin") {
        throw new Error("Administrator access is required.");
      }

      const contentHash = await sha256(file);
      const { data: duplicate, error: duplicateError } = await supabase
        .from("media_assets")
        .select("id,title,visibility")
        .eq("content_hash", contentHash)
        .maybeSingle();
      if (duplicateError) throw duplicateError;
      if (duplicate) {
        setMessage(`This file is already in the library as “${duplicate.title}” (${duplicate.visibility}). No duplicate was uploaded.`);
        return;
      }

      const folder = visibility === "public" ? "public" : `private/${user.id}`;
      uploadedPath = `${folder}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("content-files")
        .upload(uploadedPath, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("media_assets").insert({
        title,
        title_en: title,
        original_filename: file.name.slice(0, 255),
        storage_bucket: "content-files",
        storage_path: uploadedPath,
        mime_type: file.type,
        size_bytes: file.size,
        content_hash: contentHash,
        visibility,
        created_by: user.id,
      });
      if (insertError) {
        await supabase.storage.from("content-files").remove([uploadedPath]);
        uploadedPath = null;
        throw insertError;
      }

      setMessage("Media uploaded and saved to the library.");
      formElement.reset();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The file could not be uploaded.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form wide-form" onSubmit={submit}>
      <label>Media title
        <input name="title" maxLength={180} required />
      </label>
      <label>Visibility
        <select name="visibility" defaultValue="private">
          <option value="private">Private</option>
          <option value="public">Public</option>
        </select>
      </label>
      <label>File
        <input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,audio/mpeg,audio/mp4,application/pdf" required />
      </label>
      <p className="muted-note">Maximum 25 MB. SHA-256 deduplication prevents the same file being uploaded twice. Public files are readable by visitors; private files remain restricted.</p>
      {error && <p role="alert" className="form-error">{error}</p>}
      {message && <p role="status" className="form-success">{message}</p>}
      <button className="button" type="submit" disabled={busy}>{busy ? "Uploading…" : "Upload to Media Library"}</button>
    </form>
  );
}
