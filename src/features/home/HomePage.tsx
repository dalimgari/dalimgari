import { useEffect, useRef, useState } from "react";
import { AlbumCard } from "../../components/AlbumCard";
import { PublicWidgetCard } from "../../components/PublicWidgetCard";
import { getCurrentUser } from "../../services/auth";
import {
  getPublicAlbums,
  getPublicHero,
  getHomepageIncludes,
  getPublicPages,
  getPublicPosts,
  getVisibleWidgets,
  getSiteSettings,
  type PublicAlbum,
  type PublicContentItem,
  type PublicHero,
  type HomepageInclude,
  type PublicWidget,
  type SiteSettings,
} from "../../services/content";

interface HomeState {
  albums: PublicAlbum[];
  pages: PublicContentItem[];
  posts: PublicContentItem[];
  widgets: PublicWidget[];
  includes: HomepageInclude[];
  hero: PublicHero | null;
  settings: SiteSettings | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
}

function htmlToPlainText(value: string): string {
  const document = new DOMParser().parseFromString(value, "text/html");
  document.querySelectorAll("script, style").forEach((element) => element.remove());
  return document.body.textContent ?? "";
}

const initialState: HomeState = {
  albums: [],
  pages: [],
  posts: [],
  widgets: [],
  includes: [],
  hero: null,
  settings: null,
  loading: true,
  error: null,
  isAdmin: false,
};

export function HomePage() {
  const [state, setState] = useState(initialState);
  const carouselRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [pillPaused, setPillPaused] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      getPublicAlbums(),
      getPublicPages(),
      getPublicPosts(),
      getVisibleWidgets(),
      getHomepageIncludes(),
      getPublicHero(),
      getSiteSettings(),
      getCurrentUser(),
    ]).then(
      ([
        albumsResult,
        pagesResult,
        postsResult,
        widgetsResult,
        includesResult,
        heroResult,
        settingsResult,
        userResult,
      ]) => {
        if (!active) return;
        const failed = [
          albumsResult,
          pagesResult,
          postsResult,
          widgetsResult,
          heroResult,
          settingsResult,
        ].some((result) => result.status === "rejected");
        setState({
          albums: albumsResult.status === "fulfilled" ? albumsResult.value : [],
          pages: pagesResult.status === "fulfilled" ? pagesResult.value : [],
          posts: postsResult.status === "fulfilled" ? postsResult.value : [],
          widgets: widgetsResult.status === "fulfilled" ? widgetsResult.value : [],
          includes: includesResult.status === "fulfilled" ? includesResult.value : [],
          hero: heroResult.status === "fulfilled" ? heroResult.value : null,
          settings: settingsResult.status === "fulfilled" ? settingsResult.value : null,
          isAdmin:
            userResult.status === "fulfilled" &&
            String(userResult.value?.app_metadata?.role ?? "").toLowerCase() === "admin",
          loading: false,
          error: failed
            ? "Some content could not be loaded. Check the Supabase configuration and access policies."
            : null,
        });
      },
    );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || paused || state.albums.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      if (carousel.scrollWidth <= carousel.clientWidth + 2) return;
      const atEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 2;
      carousel.scrollLeft = atEnd
        ? 0
        : Math.min(carousel.scrollLeft + 1, carousel.scrollWidth - carousel.clientWidth);
    }, 24);

    return () => window.clearInterval(timer);
  }, [state.albums.length, paused]);

  useEffect(() => {
    const pills = pillRef.current;
    if (
      !pills ||
      pillPaused ||
      state.settings === null ||
      !state.settings.pagePillAutoScrollEnabled ||
      state.pages.length < 2
    )
      return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(
        () => {
          if (pills.scrollWidth <= pills.clientWidth + 2) return;
          const next =
            pills.scrollLeft + pills.clientWidth >= pills.scrollWidth - 3
              ? 0
              : pills.scrollLeft + 150;
          pills.scrollTo({ left: next, behavior: "smooth" });
        },
        state.settings?.pagePillAutoScrollIntervalSeconds
          ? state.settings.pagePillAutoScrollIntervalSeconds * 1000
          : 3000,
      );
    };
    start();
    return () => window.clearInterval(timer);
  }, [state.pages.length, state.settings, pillPaused]);

  const moveCarousel = (direction: -1 | 1) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    carousel.scrollBy({
      left: direction * Math.max(220, carousel.clientWidth * 0.75),
      behavior: "smooth",
    });
  };

  if (state.settings?.maintenanceMode && !state.isAdmin) {
    return (
      <section className="notice-card" aria-labelledby="maintenance-title">
        <h1 id="maintenance-title">Website temporarily under maintenance</h1>
        <p>Please try again in a moment.</p>
      </section>
    );
  }

  return (
    <section className="home-content" aria-labelledby="home-title">
      {state.settings?.maintenanceMode ? (
        <section className="notice-card">
          <h1>Website temporarily under maintenance</h1>
          <p>Please try again in a moment.</p>
        </section>
      ) : null}

      {state.hero &&
      (state.hero.title ||
        state.hero.description ||
        state.hero.imageUrl ||
        state.settings?.tagline) ? (
        <section className="home-hero" aria-label="Main introduction">
          {state.hero.imageUrl ? (
            <img src={state.hero.imageUrl} alt="" fetchPriority="high" />
          ) : null}
          <div className="home-hero-copy">
            {state.settings?.tagline ? <p className="eyebrow">{state.settings.tagline}</p> : null}
            <h1 id="home-title">
              {state.hero.title || state.settings?.siteTitle || "Dalimgari Community"}
            </h1>
            {state.hero.description ? <p>{state.hero.description}</p> : null}
          </div>
        </section>
      ) : (
        <>
          <p className="eyebrow">Dalimgari Community</p>
          <h1 id="home-title">Dalimgari Community</h1>
          <p>A collection of Dalimgari memories, people, and photographs.</p>
        </>
      )}

      {state.pages.length > 0 ? (
        <section className="home-pages" aria-labelledby="pages-title">
          <h2 id="pages-title">Pages</h2>
          <div
            ref={pillRef}
            className="home-page-pillbar"
            aria-label="Public pages"
            onMouseEnter={() => setPillPaused(true)}
            onMouseLeave={() => setPillPaused(false)}
            onFocus={() => setPillPaused(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                setPillPaused(false);
            }}
          >
            {state.pages.map((page) => (
              <button
                key={page.id}
                type="button"
                className="home-page-pill"
                onClick={() => document.getElementById("public-page-card-" + page.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                {page.title}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {state.pages.length > 0 ? (
        <section className="home-page-cards" aria-label="Public page cards">
          {state.pages.map((page) => (
            <article className="home-page-card" id={"public-page-card-" + page.id} key={page.id}>
              <h2>{page.title}</h2>
              {page.description ? <p>{page.description}</p> : <p>Open this page to read its content.</p>}
              {page.url ? <a href={"#/pages/" + encodeURIComponent(page.url)}>See more</a> : null}
            </article>
          ))}
        </section>
      ) : null}

      {state.loading ? <p role="status">Loading content…</p> : null}
      {state.error ? <p role="alert">{state.error}</p> : null}

      {state.includes.length > 0 ? (
        <section className="home-included-content" aria-label="Featured content">
          {state.includes.map((item) => (
            <article className="home-content-card" key={item.section}>
              <h2>{item.title}</h2>
              <p className="post-excerpt">
                {htmlToPlainText(item.content).replace(/\\s+/g, " ").trim()}
              </p>
            </article>
          ))}
        </section>
      ) : null}

      {state.widgets.length > 0 ? (
        <section className="home-widgets" aria-labelledby="widgets-title">
          <h2 id="widgets-title">Community widgets</h2>
          <div className="home-content-grid">
            {state.widgets.map((widget) => (
              <PublicWidgetCard key={widget.id} widget={widget} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="home-albums" aria-labelledby="albums-title">
        <div className="section-heading">
          <h2 id="albums-title">Albums</h2>
          {state.albums.length > 1 ? (
            <div className="carousel-controls" aria-label="Album carousel controls">
              <button type="button" onClick={() => moveCarousel(-1)} aria-label="Previous album">
                ‹
              </button>
              <button type="button" onClick={() => moveCarousel(1)} aria-label="Next album">
                ›
              </button>
            </div>
          ) : null}
        </div>
        {!state.loading && !state.error && state.albums.length === 0 ? (
          <p>There are no public albums yet.</p>
        ) : null}
        {state.albums.length > 0 ? (
          <div
            ref={carouselRef}
            className="album-carousel"
            aria-label="Public albums"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                setPaused(false);
            }}
            tabIndex={0}
          >
            {state.albums.map((album) => (
              <AlbumCard
                key={album.id}
                title={album.title}
                description={album.description ?? undefined}
                imageUrl={album.coverUrl ?? undefined}
                href={"/albums/" + encodeURIComponent(album.id)}
              />
            ))}
          </div>
        ) : null}
      </section>

      {state.posts.length > 0 ? (
        <section className="home-posts" aria-labelledby="posts-title">
          <h2 id="posts-title">Recent posts</h2>
          <div className="home-content-grid">
            {state.posts.map((post) => (
              <article className="home-content-card" key={post.id}>
                <h3>{post.title}</h3>
                {post.content ? (
                  <p className="post-excerpt">
                    {htmlToPlainText(post.content).replace(/\\s+/g, " ").trim().slice(0, 320)}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
