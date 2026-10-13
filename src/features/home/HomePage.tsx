import { useEffect, useRef, useState } from "react";
import { AlbumCard } from "../../components/AlbumCard";
import {
  getPublicAlbums,
  getPublicHero,
  getPublicPageByUrl,
  getPublicPages,
  getSiteSettings,
  type PublicAlbum,
  type PublicContentItem,
  type PublicHero,
  type SiteSettings,
} from "../../services/content";

interface HomeState {
  albums: PublicAlbum[];
  pages: PublicContentItem[];
  hero: PublicHero | null;
  settings: SiteSettings | null;
  loading: boolean;
  error: string | null;
}

const initialState: HomeState = {
  albums: [],
  pages: [],
  hero: null,
  settings: null,
  loading: true,
  error: null,
};

export function HomePage() {
  const [state, setState] = useState(initialState);
  const carouselRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [selectedPage, setSelectedPage] = useState<PublicContentItem | null>(null);
  const [pageContent, setPageContent] = useState("");
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.allSettled([getPublicAlbums(), getPublicPages(), getPublicHero(), getSiteSettings()])
      .then(([albumsResult, pagesResult, heroResult, settingsResult]) => {
        if (!active) return;
        const failed = [albumsResult, pagesResult, heroResult, settingsResult].some(
          (result) => result.status === "rejected",
        );
        setState({
          albums: albumsResult.status === "fulfilled" ? albumsResult.value : [],
          pages: pagesResult.status === "fulfilled" ? pagesResult.value : [],
          hero: heroResult.status === "fulfilled" ? heroResult.value : null,
          settings: settingsResult.status === "fulfilled" ? settingsResult.value : null,
          loading: false,
          error: failed ? "কিছু কনটেন্ট লোড করা যায়নি। Supabase configuration ও access policy যাচাই করুন।" : null,
        });
      });
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
    if (!pills || state.settings === null || state.pages.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        if (pills.scrollWidth <= pills.clientWidth + 2) return;
        const next = pills.scrollLeft + pills.clientWidth >= pills.scrollWidth - 3 ? 0 : pills.scrollLeft + 150;
        pills.scrollTo({ left: next, behavior: "smooth" });
      }, 3000);
    };
    start();
    return () => window.clearInterval(timer);
  }, [state.pages.length, state.settings]);

  const moveCarousel = (direction: -1 | 1) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    carousel.scrollBy({
      left: direction * Math.max(220, carousel.clientWidth * 0.75),
      behavior: "smooth",
    });
  };

  const openPage = async (page: PublicContentItem) => {
    if (!page.url) return;
    setSelectedPage(page);
    setPageContent("");
    setPageError(null);
    setPageLoading(true);
    try {
      const result = await getPublicPageByUrl(page.url);
      setPageContent(result?.content ?? "");
      if (!result) setPageError("পেজটি পাওয়া যায়নি অথবা এটি আর পাবলিক নেই।");
    } catch {
      setPageError("পেজের কনটেন্ট লোড করা যায়নি।");
    } finally {
      setPageLoading(false);
    }
  };

  return (
    <section className="home-content" aria-labelledby="home-title">
      {state.settings?.maintenanceMode ? (
        <section className="notice-card">
          <h1>ওয়েবসাইট সাময়িক রক্ষণাবেক্ষণে</h1>
          <p>কিছু সময় পরে আবার চেষ্টা করুন।</p>
        </section>
      ) : null}

      {state.hero && (state.hero.title || state.hero.description || state.hero.imageUrl || state.settings?.tagline) ? (
        <section className="home-hero" aria-label="প্রধান পরিচিতি">
          {state.hero.imageUrl ? <img src={state.hero.imageUrl} alt="" fetchPriority="high" /> : null}
          <div className="home-hero-copy">
            {state.settings?.tagline ? <p className="eyebrow">{state.settings.tagline}</p> : null}
            <h1 id="home-title">{state.hero.title || state.settings?.siteTitle || "ডালিমগাড়ী কমিউনিটি"}</h1>
            {state.hero.description ? <p>{state.hero.description}</p> : null}
          </div>
        </section>
      ) : (
        <>
          <p className="eyebrow">Dalimgari Community</p>
          <h1 id="home-title">ডালিমগাড়ী কমিউনিটি</h1>
          <p>ডালিমগাড়ীর স্মৃতি, মানুষ ও ছবির সংগ্রহ।</p>
        </>
      )}

      {state.pages.length > 0 ? (
        <section className="home-pages" aria-labelledby="pages-title">
          <h2 id="pages-title">পেজসমূহ</h2>
          <div
            ref={pillRef}
            className="home-page-pillbar"
            aria-label="পাবলিক পেজ"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
            }}
          >
            {state.pages.map((page) => (
              <button key={page.id} type="button" className="home-page-pill" onClick={() => void openPage(page)}>
                {page.title}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {selectedPage ? (
        <section className="public-page-panel" aria-labelledby="public-page-title">
          <div className="section-heading">
            <h2 id="public-page-title">{selectedPage.title}</h2>
            <button
              type="button"
              onClick={() => {
                setSelectedPage(null);
                setPageContent("");
                setPageError(null);
              }}
              aria-label="পেজ বন্ধ করুন"
            >
              বন্ধ
            </button>
          </div>
          {pageLoading ? <p role="status">পেজ লোড হচ্ছে…</p> : null}
          {pageError ? <p role="alert">{pageError}</p> : null}
          {pageContent ? <div className="public-page-content">{pageContent}</div> : null}
          {!pageLoading && !pageError && !pageContent ? <p>এই পেজে প্রদর্শনের মতো লেখা নেই।</p> : null}
        </section>
      ) : null}

      {state.loading ? <p role="status">কনটেন্ট লোড হচ্ছে…</p> : null}
      {state.error ? <p role="alert">{state.error}</p> : null}

      <section className="home-albums" aria-labelledby="albums-title">
        <div className="section-heading">
          <h2 id="albums-title">অ্যালবাম</h2>
          {state.albums.length > 1 ? (
            <div className="carousel-controls" aria-label="অ্যালবাম স্ক্রল নিয়ন্ত্রণ">
              <button type="button" onClick={() => moveCarousel(-1)} aria-label="আগের অ্যালবাম">‹</button>
              <button type="button" onClick={() => moveCarousel(1)} aria-label="পরের অ্যালবাম">›</button>
            </div>
          ) : null}
        </div>
        {!state.loading && !state.error && state.albums.length === 0 ? <p>এখনো কোনো পাবলিক অ্যালবাম নেই।</p> : null}
        {state.albums.length > 0 ? (
          <div
            ref={carouselRef}
            className="album-carousel"
            aria-label="পাবলিক অ্যালবাম"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
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
    </section>
  );
}
