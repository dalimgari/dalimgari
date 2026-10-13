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
  description?: string | null;
  url?: string | null;
  content?: string | null;
  media: unknown;
  visibility: string;
  created_at: string | null;
}

export interface PublicHero {
  title: string;
  description: string | null;
  imageUrl: string | null;
}

export interface SiteSettings {
  siteTitle: string;
  tagline: string;
  maintenanceMode: boolean;
  homepageDefaultRoute: string;
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

function parseJsonObject(value: unknown): Record<string, unknown> {
  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed) as unknown;
    } catch {
      return {};
    }
  }
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
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
        .filter((id): id is string | number => typeof id === "string" || typeof id === "number")
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

export async function getSiteSettings(): Promise<SiteSettings> {
  const client = getClient();
  const { data, error } = await client
    .from("site_customizations")
    .select("key,value")
    .in("key", ["ui_settings_general", "ui_customization_identity", "ui_settings_maintenance_features", "ui_settings_homepage_defaults"]);
  if (error) throw error;

  const values = new Map((data ?? []).map((row) => [row.key, parseJsonObject(row.value)]));
  const general = values.get("ui_settings_general") ?? {};
  const identity = values.get("ui_customization_identity") ?? {};
  const maintenance = values.get("ui_settings_maintenance_features") ?? {};
  const homepage = values.get("ui_settings_homepage_defaults") ?? {};

  return {
    siteTitle: typeof general.site_title === "string" ? general.site_title : "Dalimgari",
    tagline: typeof identity.tagline === "string" ? identity.tagline : "",
    maintenanceMode: maintenance.maintenance_mode === true,
    homepageDefaultRoute: typeof homepage.default_home_route === "string" ? homepage.default_home_route : "home",
  };
}

export async function getPublicPages(limit = 200): Promise<PublicContentItem[]> {
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 500));
  const { data, error } = await getClient()
    .from("pages")
    .select("id,title,url,visibility,created_at")
    .eq("visibility", "public")
    .order("created_at", { ascending: true })
    .limit(safeLimit);
  if (error) throw error;

  const pages = (data ?? []) as unknown as PublicContentItem[];
  const { data: orderRow, error: orderError } = await getClient()
    .from("site_customizations")
    .select("value")
    .eq("key", "home_page_order")
    .maybeSingle();
  if (orderError) return pages;

  const ids = parseAlbumOrder(orderRow?.value);
  if (!ids) return pages;
  const rank = new Map(ids.map((id, index) => [id, index]));
  return pages.sort((a, b) => {
    const ar = rank.get(String(a.id)) ?? Number.MAX_SAFE_INTEGER;
    const br = rank.get(String(b.id)) ?? Number.MAX_SAFE_INTEGER;
    return ar - br || Date.parse(a.created_at ?? "") - Date.parse(b.created_at ?? "");
  });
}

export async function getPublicPageByUrl(url: string): Promise<PublicContentItem | null> {
  const safeUrl = url.trim().replace(/^\/+|\/+$/g, "");
  if (!safeUrl || safeUrl.length > 200) return null;
  const { data, error } = await getClient()
    .from("pages")
    .select("id,title,url,content,visibility,created_at")
    .eq("url", safeUrl)
    .eq("visibility", "public")
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as PublicContentItem | null) ?? null;
}

export async function getPublicHero(): Promise<PublicHero | null> {
  const client = getClient();
  const { data, error } = await client
    .from("hero_items")
    .select("title,description,media,visibility,created_at")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;

  if (data) {
    const media = asMediaItems(data.media);
    const image = media.find((item) => (item.mime_type ?? "").startsWith("image/"));
    return {
      title: data.title ?? "",
      description: data.description ?? "",
      imageUrl: image?.path ? await createContentMediaUrl(image.path) : null,
    };
  }

  const { data: setting, error: settingError } = await client
    .from("site_customizations")
    .select("value")
    .eq("key", "home_hero")
    .maybeSingle();
  if (settingError) return null;
  const value = parseJsonObject(setting?.value);
  return {
    title: typeof value.headline === "string" ? value.headline : "",
    description: typeof value.welcomeMessage === "string" ? value.welcomeMessage : "",
    imageUrl: typeof value.heroImageUrl === "string" ? value.heroImageUrl : null,
  };
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
    client.from("site_customizations").select("value").eq("key", "home_album_order").maybeSingle(),
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
