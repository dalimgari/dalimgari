import { useEffect, useRef, useState } from "react";
import { AlbumCard } from "../../components/AlbumCard";
import { usePublicAlbums } from "../albums/usePublicAlbums";

export function HomePage() {
  const { albums, loading, error } = usePublicAlbums();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || paused || albums.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      if (carousel.scrollWidth <= carousel.clientWidth + 2) return;
      const atEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 2;
      carousel.scrollLeft = atEnd ? 0 : Math.min(carousel.scrollLeft + 1, carousel.scrollWidth - carousel.clientWidth);
    }, 24);

    return () => window.clearInterval(timer);
  }, [albums.length, paused]);

  const moveCarousel = (direction: -1 | 1) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    carousel.scrollBy({ left: direction * Math.max(220, carousel.clientWidth * 0.75), behavior: "smooth" });
  };

  return (
    <section className="home-content" aria-labelledby="home-title">
      <p className="eyebrow">Dalimgari Community</p>
      <h1 id="home-title">ডালিমগাড়ী কমিউনিটি</h1>
      <p>ডালিমগাড়ীর স্মৃতি, মানুষ ও ছবির সংগ্রহ।</p>

      <section className="home-albums" aria-labelledby="albums-title">
        <div className="section-heading">
          <h2 id="albums-title">অ্যালবাম</h2>
          {albums.length > 1 ? (
            <div className="carousel-controls" aria-label="অ্যালবাম স্ক্রল নিয়ন্ত্রণ">
              <button type="button" onClick={() => moveCarousel(-1)} aria-label="আগের অ্যালবাম">‹</button>
              <button type="button" onClick={() => moveCarousel(1)} aria-label="পরের অ্যালবাম">›</button>
            </div>
          ) : null}
        </div>

        {loading ? <p role="status">অ্যালবাম লোড হচ্ছে…</p> : null}
        {error ? <p role="alert">অ্যালবাম লোড করা যায়নি। {error}</p> : null}
        {!loading && !error && albums.length === 0 ? <p>এখনো কোনো পাবলিক অ্যালবাম নেই।</p> : null}

        {albums.length > 0 ? (
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
            {albums.map((album) => (
              <AlbumCard
                key={album.id}
                title={album.title}
                description={album.description ?? undefined}
                imageUrl={album.coverUrl ?? undefined}
              />
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
}
