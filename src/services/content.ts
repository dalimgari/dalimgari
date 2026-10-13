import { supabase } from "./supabase";

export interface AlbumMediaItem {
  path: string;
  mime_type?: string | null;
  alt_text?: string | null;
  title?: string | null;
  name?: string | null;
}

export interface PublicAlbum {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  cover_path: string | null;
  media: AlbumMediaItem[] | null;
  coverUrl: string | null;
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

function asMediaItems(value: unknown): AlbumMediaItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is AlbumMediaItem =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as { path?: unknown }).path === "string" &&
      Boolean((item as { path: string }).path.trim()),
  );
}

function parseAlbumOrder(value: unknown): string[] | null {
  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed) as unknown;
    } catch {
      return null;
    }
  }

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    parsed = (parsed as { ids?: unknown }).ids;
  }

  return Array.isArray(parsed)
    ? parsed
        .filter(
          (id): id is string | number =>
            typeof id === "string" || typeof id === "number",
        )
        .map(String)
    : null;
}

async function createContentMediaUrl(path: string): Promise<string | null> {
  const { data, error } = await getClient()
    .storage.from("content-files")
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl || null;
}

/** Fetches public albums, preserves configured homepage ordering, and signs cover images. */
export async function getPublicAlbums(limit = 24): Promise<PublicAlbum[]> {
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 200));
  const client = getClient();
  const [albumResult, orderResult] = await Promise.all([
    client
      .from("albums")
      .select("id,title,description,url,cover_path,media,created_at")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(safeLimit),
    client
      .from("site_customizations")
      .select("value")
      .eq("key", "home_album_order")
      .maybeSingle(),
  ]);
  if (albumResult.error) throw albumResult.error;

  const rows = (albumResult.data ?? []) as unknown as Omit<PublicAlbum, "coverUrl">[];
  const albums = rows
    .map((album) => ({
      ...album,
      media: asMediaItems(album.media),
      coverUrl: null as string | null,
    }))
    .filter((album) => Boolean(album.cover_path?.trim()) || album.media.length > 0);

  if (!orderResult.error) {
    const ids = parseAlbumOrder(orderResult.data?.value);
    if (ids) {
      const byId = new Map(albums.map((album) => [String(album.id), album]));
      const ordered = ids.map((id) => byId.get(id)).filter((album) => album !== undefined);
      const orderedIds = new Set(ordered.map((album) => String(album.id)));
      albums.splice(
        0,
        albums.length,
        ...ordered,
        ...albums.filter((album) => !orderedIds.has(String(album.id))),
      );
    }
  }

  return Promise.all(
    albums.map(async (album) => {
      const firstImage = album.media.find(
        (item) => item.path && String(item.mime_type ?? "").startsWith("image/"),
      );
      const coverPath = firstImage?.path || album.cover_path;
      const coverUrl = coverPath ? await createContentMediaUrl(coverPath) : null;
      return { ...album, coverUrl };
    }),
  );
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
