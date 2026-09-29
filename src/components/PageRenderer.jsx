import { useMemo } from "react";

function PageRenderer({ page, photos = [], videos = [] }) {
  const contentType = page?.content_type || "information";

  const pagePhotos = useMemo(() => {
    if (!page?.id) return [];
    return photos.filter((item) => item.published !== false);
  }, [page?.id, photos]);

  const pageVideos = useMemo(() => {
    if (!page?.id) return [];
    return videos.filter((item) => item.published !== false);
  }, [page?.id, videos]);

  if (!page) {
    return <p>Page not found.</p>;
  }

  return (
    <article className="page-renderer">
      {page.cover_media && (
        <img
          src={page.cover_media}
          alt={page.title || "Page cover"}
          className="page-cover"
        />
      )}

      <header>
        <h2>{page.title}</h2>
      </header>

      {contentType === "information" && (
        <div className="page-content">
          {page.content && <p>{page.content}</p>}
        </div>
      )}

      {contentType === "article" && (
        <div className="page-content">
          {page.content && <p>{page.content}</p>}
        </div>
      )}

      {contentType === "contact" && (
        <div className="page-content">
          {page.content && <p>{page.content}</p>}
        </div>
      )}

      {contentType === "custom" && (
        <div className="page-content">
          {page.content && <p>{page.content}</p>}
        </div>
      )}

      {(contentType === "photo-gallery" ||
        contentType === "photo-video-gallery") && (
        <div className="page-gallery">
          {pagePhotos.length === 0 ? (
            <p>No photos available.</p>
          ) : (
            pagePhotos.map((photo) => (
              <figure key={photo.id}>
                <img
                  src={photo.media_url}
                  alt={photo.title || "Photo"}
                />
                {photo.title && <figcaption>{photo.title}</figcaption>}
              </figure>
            ))
          )}
        </div>
      )}

      {(contentType === "video-gallery" ||
        contentType === "photo-video-gallery") && (
        <div className="page-video-gallery">
          {pageVideos.length === 0 ? (
            <p>No videos available.</p>
          ) : (
            pageVideos.map((video) => (
              <figure key={video.id}>
                <video
                  src={video.media_url}
                  controls
                  preload="metadata"
                />
                {video.title && <figcaption>{video.title}</figcaption>}
              </figure>
            ))
          )}
        </div>
      )}
    </article>
  );
}

export default PageRenderer;
