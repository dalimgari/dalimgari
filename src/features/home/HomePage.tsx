import { AlbumCard } from "../../components/AlbumCard";
import { usePublicAlbums } from "../albums/usePublicAlbums";

export function HomePage() {
  const { albums, loading, error } = usePublicAlbums();

  return (
    <section aria-labelledby="home-title">
      <p className="eyebrow">Dalimgari Community</p>
      <h1 id="home-title">ডালিমগাড়ী কমিউনিটি</h1>
      <p>
        This migration preview loads public album records through the Supabase service.
        The production website remains unchanged until feature parity is verified.
      </p>
      <section aria-labelledby="albums-title">
        <h2 id="albums-title">Albums</h2>
        {loading ? <p role="status">Loading albums…</p> : null}
        {error ? <p role="alert">Albums are unavailable: {error}</p> : null}
        {!loading && !error && albums.length === 0 ? <p>No public albums are available.</p> : null}
        {albums.length > 0 ? (
          <div className="album-grid">
            {albums.map((album) => (
              <AlbumCard key={album.id} title={album.title}
                description={album.description ?? undefined}
                imageUrl={album.cover_path ?? undefined} />
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
}
