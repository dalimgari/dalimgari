function PageRenderer({ page }) {
  if (!page) return null;

  const content = page.content || "";

  if (page.content_type === "gallery") {
    return (
      <div className="page-type-gallery">
        {page.cover_image && (
          <img
            src={page.cover_image}
            alt={page.title}
            className="card-image"
          />
        )}
        <div className="page-content">
          {content && <p>{content}</p>}
        </div>
      </div>
    );
  }

  if (page.content_type === "video") {
    return (
      <div className="page-type-video">
        {page.cover_image && (
          <video
            src={page.cover_image}
            controls
            className="card-image"
          />
        )}
        <div className="page-content">
          {content && <p>{content}</p>}
        </div>
      </div>
    );
  }

  if (page.content_type === "people") {
    return (
      <div className="page-type-people">
        <div className="page-content">
          {content && <p>{content}</p>}
        </div>
      </div>
    );
  }

  if (page.content_type === "news") {
    return (
      <article className="page-type-news">
        {page.cover_image && (
          <img
            src={page.cover_image}
            alt={page.title}
            className="card-image"
          />
        )}
        <div className="page-content">
          {content && <p>{content}</p>}
        </div>
      </article>
    );
  }

  if (page.content_type === "events") {
    return (
      <article className="page-type-events">
        {page.cover_image && (
          <img
            src={page.cover_image}
            alt={page.title}
            className="card-image"
          />
        )}
        <div className="page-content">
          {content && <p>{content}</p>}
        </div>
      </article>
    );
  }

  if (page.content_type === "article") {
    return (
      <article className="page-type-article">
        {page.cover_image && (
          <img
            src={page.cover_image}
            alt={page.title}
            className="card-image"
          />
        )}
        <div className="page-content">
          {content.split(/\n\s*\n/).map(
            (paragraph, index) => (
              <p key={index}>{paragraph}</p>
            )
          )}
        </div>
      </article>
    );
  }

  if (page.content_type === "info") {
    return (
      <div className="page-type-info">
        {page.cover_image && (
          <img
            src={page.cover_image}
            alt={page.title}
            className="card-image"
          />
        )}
        <div className="page-content">
          {content.split(/\n\s*\n/).map(
            (paragraph, index) => (
              <p key={index}>{paragraph}</p>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-type-custom">
      {page.cover_image && (
        <img
          src={page.cover_image}
          alt={page.title}
          className="card-image"
        />
      )}
      <div className="page-content">
        {content.split(/\n\s*\n/).map(
          (paragraph, index) => (
            <p key={index}>{paragraph}</p>
          )
        )}
      </div>
    </div>
  );
}

export default PageRenderer;
