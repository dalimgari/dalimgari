import { supabase } from "./supabase";

export interface PublicAlbum {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  cover_path: string | null;
  media: unknown;
  created_at: string | null;
}

export interface PublicContentItem {
  id: string;
  title: string;
  media: unknown;
  visibility: string;
  created_at: string | null;
}

function getClient() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  return supabase;
}

/** Fetches only publicly visible albums, ordered consistently with the legacy homepage. */
export async function getPublicAlbums(limit = 200): Promise<PublicAlbum[]> {
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 200));
  const { data, error } = await getClient()
    .from("albums")
    .select("id,title,description,url,cover_path,media,created_at")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(safeLimit);
  if (error) throw error;
  return (data ?? []) as PublicAlbum[];
}

/** Fetches public posts, pages, or hero items using their shared legacy columns. */
export async function getPublicContentItems(
  table: "post" | "pages" | "hero_items",
  limit = 200,
): Promise<PublicContentItem[]> {
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 500));
  const { data, error } = await getClient()
    .from(table)
    .select("id,title,media,visibility,created_at")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(safeLimit);
  if (error) throw error;
  return (data ?? []) as PublicContentItem[];
}
