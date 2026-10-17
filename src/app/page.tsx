import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeManagedHtml } from "@/lib/sanitize-managed-html";
import { BangladeshClock } from "./widgets/bangladesh-clock";

export const dynamic = "force-dynamic";

type HomePageRecord = {
  id: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  content: string;
  content_en: string | null;
  url: string;
  visibility: string;
};

type AlbumRecord = {
  id: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  url: string;
};

export default async function HomePage() {
  let hero: { title: string; title_en: string | null; description: string | null; description_en: string | null } | null = null;
  let pages: HomePageRecord[] = [];
  let albums: AlbumRecord[] = [];
  let mapWidget: { settings: unknown } | null = null;
  let showClock = true;

  try {
    const supabase = await createSupabaseServerClient();
    const [heroResult, pageResult, albumResult, widgetResult] = await Promise.all([
      supabase.from("hero_items").select("title,title_en,description,description_en").eq("visibility", "public").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("pages").select("id,title,title_en,description,description_en,content,content_en,url,visibility").eq("visibility", "public").order("created_at", { ascending: false }).limit(6),
      supabase.from("albums").select("id,title,title_en,description,description_en,url").eq("visibility", "public").order("created_at", { ascending: false }).limit(8),
      supabase.from("widgets").select("widget_type,settings,is_visible").in("widget_type", ["map", "datetime"]),
    ]);
    hero = heroResult.data;
    pages = pageResult.data ?? [];
    const albumRows = albumResult.data ?? [];
    if (albumRows.length > 0) {
      const { data: links } = await supabase.from("media_links")
        .select("source_id")
        .eq("source_table", "albums")
        .in("source_id", albumRows.map((album) => album.id));
      const linkedAlbumIds = new Set((links ?? []).map((link) => link.source_id));
      albums = albumRows.filter((album) => linkedAlbumIds.has(album.id));
    }
    const visibleWidgets = (widgetResult.data ?? []).filter((widget) => widget.is_visible);
    mapWidget = visibleWidgets.find((widget) => widget.widget_type === "map") ?? null;
    showClock = visibleWidgets.some((widget) => widget.widget_type === "datetime");
  } catch {
    // Public fallback keeps the site usable until environment variables are configured.
  }

  const heroTitle = hero?.title_en || hero?.title || "Welcome to Dalimgari";
  const heroDescription = hero?.description_en || hero?.description || "A digital home for village stories, community updates, photographs, and shared memories.";

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">A connected village community</p>
        <h1 id="hero-title">{heroTitle}</h1>
        <p className="lead">{heroDescription}</p>
        <div className="actions">
          <Link className="button" href="/pages">Explore village pages</Link>
          <Link className="button secondary" href="/login">Community account</Link>
        </div>
      </section>

      {pages.length > 0 && (
        <nav className="page-pills" aria-label="Published page shortcuts">
          {pages.map((page) => (
            <a key={page.id} href={`#page-${page.id}`}>{page.title_en || page.title}</a>
          ))}
        </nav>
      )}

      <section className="section widget-grid" aria-label="Community widgets">
        {showClock && <BangladeshClock />}
        {mapWidget && (
          <article className="card">
            <p className="muted-note">Open the saved village location.</p>
            <Link className="button secondary" href="/map">Open map</Link>
          </article>
        )}
      </section>

      {albums.length > 0 && (
        <section className="section" aria-labelledby="albums-title">
          <h2 id="albums-title">Community albums</h2>
          <div className="section-grid">
            {albums.map((album) => (
              <Link className="card card-link" href={`/gallery/${encodeURIComponent(album.url)}`} key={album.id}>
                <h3>{album.title_en || album.title}</h3>
                {(album.description_en || album.description) && <p>{album.description_en || album.description}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {pages.length > 0 && (
        <section className="section" aria-labelledby="pages-title">
          <h2 id="pages-title">Community pages</h2>
          <div className="section-grid">
            {pages.map((page) => (
              <article className="card page-card" id={`page-${page.id}`} key={page.id}>
                <h3>{page.title_en || page.title}</h3>
                {(page.description_en || page.description) && <p>{page.description_en || page.description}</p>}
                <div className="page-card-content" dangerouslySetInnerHTML={{ __html: sanitizeManagedHtml(page.content_en || page.content || "") }} />
                <Link className="button secondary" href={`/p/${encodeURIComponent(page.url)}`}>See more</Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
