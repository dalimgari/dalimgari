function isVideoUrl(url) {
  if (!url) return false;

  return (
    /youtube\.com|youtu\.be|vimeo\.com/i.test(url) ||
    /\.(mp4|webm|ogg)(\?.*)?$/i.test(url)
  );
}

function PageRenderer({ page }) {
  if (!page) return null;

  const title = page.title || "";
  const content = page.content || "";
  const media = page.cover_image || "";

  function renderMedia() {
    if (!media) return null;

    if (page.content_type === "video" || isVideoUrl(media)) {
      if (/youtube\.com|youtu\.be|vimeo\.com/i.test(media)) {
        return (
          <div className="page-video-embed">
            <iframe
              src={media}
              title={title}
              loading="lazy"
              allowFullScreen
            />
          </div>
        );
      }

      return (
        <video
          src={media}
          controls
          preload="metadata"
          className="card-image"
        />
      );
    }

    return (
      <img
        src={media}
        alt={title}
        className="card-image"
      />
    );
  }

  function renderText() {
    return (
      <div className="page-content">
        {content.split(/\n\s*\n/).map(
          (paragraph, index) => (
            <p key={index}>
              {paragraph.split("\n").map(
                (line, lineIndex) => (
                  <span key={lineIndex}>
                    {line}
                    {lineIndex <
                      paragraph.split("\n").length - 1 && (
                      <br />
                    )}
                  </span>
                )
              )}
            </p>
          )
        )}
      </div>
    );
  }

  if (page.content_type === "article") {
    return (
      <article className="page-type-article">
        {renderMedia()}
        {renderText()}
      </article>
    );
  }

  if (page.content_type === "info") {
    return (
      <section className="page-type-info">
        {renderMedia()}
        {renderText()}
      </section>
    );
  }

  if (page.content_type === "gallery") {
    return (
      <section className="page-type-gallery">
        {renderMedia()}
        {renderText()}
      </section>
    );
  }

  if (page.content_type === "people") {
    return (
      <section className="page-type-people">
        {renderMedia()}
        {renderText()}
      </section>
    );
  }

  if (page.content_type === "video") {
    return (
      <section className="page-type-video">
        {renderMedia()}
        {renderText()}
      </section>
    );
  }

  if (page.content_type === "news") {
    return (
      <article className="page-type-news">
        {renderMedia()}
        {renderText()}
      </article>
    );
  }

  if (page.content_type === "events") {
    return (
      <article className="page-type-events">
        {renderMedia()}
        {renderText()}
      </article>
    );
  }

  return (
    <section className="page-type-custom">
      {renderMedia()}
      {renderText()}
    </section>
  );
}

export default PageRenderer;
