import { supabase } from "./supabase";

function getClient() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  return supabase;
}

/**
 * Creates a public URL for a path in an existing public bucket.
 * Use only for media whose bucket/policy is intended to be publicly readable.
 */
export function getPublicMediaUrl(bucket: string, path: string): string {
  const normalizedPath = path.trim().replace(/^\/+/, "");
  if (!bucket.trim() || !normalizedPath) {
    throw new Error("A bucket and media path are required.");
  }
  return getClient().storage.from(bucket).getPublicUrl(normalizedPath).data.publicUrl;
}

/** Uploads to a specified bucket; Storage policies remain the authorization boundary. */
export async function uploadMedia(
  bucket: string,
  path: string,
  file: File,
  options: { upsert?: boolean; cacheControl?: string } = {},
): Promise<string> {
  if (!bucket.trim() || !path.trim()) {
    throw new Error("A bucket and destination path are required.");
  }
  const { data, error } = await getClient()
    .storage.from(bucket)
    .upload(path, file, {
      upsert: options.upsert ?? false,
      cacheControl: options.cacheControl ?? "3600",
      contentType: file.type || undefined,
    });
  if (error) throw error;
  return data.path;
}
