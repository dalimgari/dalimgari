import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Modal } from "../../components/Modal";
import { getPublicAlbumById, type PublicGalleryAlbum } from "../../services/content";

export function GalleryPage() {
  const { albumId } = useParams();
  const [album, setAlbum] = useState<PublicGalleryAlbum | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; title: string; mimeType: string } | null>(null);

  useEffect(() => {
    let active = true;
    if (!albumId) {
      setError("অ্যালবামের ঠিকানা সঠিক নয়।");
      setLoading(false);
      return;
    }
    getPublicAlbumById(albumId)
      .then((result) => {
        if (!active) return;
        if (!result) setError("অ্যালবামটি পাওয়া যায়নি অথবা এটি আর পাবলিক নেই।");
        setAlbum(result);
      })
      .catch(() => {
        if (active) setError("অ্যালবাম লোড করা যায়নি।");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [albumId]);

  const visibleMedia = (album?.media ?? []).filter((item) => {
    const mime = item.mime_type ?? "";
    return item.signedUrl && (mime.startsWith("image/") || mime.startsWith("video/"));
  });

  return (
    <section className="gallery-page" aria-labelledby="gallery-title">
      {loading ? <p role="status">অ্যালবাম লোড হচ্ছে…</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {album ? (
        <>
          <h1 id="gallery-title">{album.title}</h1>
          {album.description ? <p>{album.description}</p> : null}
          {visibleMedia.length === 0 ? <p>এই অ্যালবামে প্রদর্শনযোগ্য ছবি বা ভিডিও নেই।</p> : null}
          <div className="gallery-grid">
            {visibleMedia.map((item, index) => {
              const title = item.title || item.alt_text || item.name || album.title + " — " + (index + 1);
              if ((item.mime_type ?? "").startsWith("video/")) {
                return (
                  <article className="gallery-item" key={item.path}>
                    <video controls preload="metadata" src={item.signedUrl ?? undefined}>
                      আপনার ব্রাউজার ভিডিও চালাতে পারে না।
                    </video>
                    <p>{title}</p>
                  </article>
                );
              }
              return (
                <button
                  className="gallery-item gallery-image-button"
                  key={item.path}
                  type="button"
                  onClick={() => setSelectedMedia({ url: item.signedUrl!, title, mimeType: item.mime_type ?? "image/*" })}
                  aria-label={"ছবি দেখুন: " + title}
                >
                  <img src={item.signedUrl ?? undefined} alt={item.alt_text || title} loading="lazy" decoding="async" />
                  <span>{title}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}
      <Modal title={selectedMedia?.title ?? "ছবি"} open={selectedMedia !== null} onClose={() => setSelectedMedia(null)}>
        {selectedMedia ? <img className="gallery-modal-image" src={selectedMedia.url} alt={selectedMedia.title} /> : null}
      </Modal>
    </section>
  );
}
