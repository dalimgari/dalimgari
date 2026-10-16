import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getPublicPageByUrl, type PublicContentItem } from "../../services/content";
import { sanitizeHtml } from "../../utils/sanitizeHtml";

export function PublicPagePage() {
  const location = useLocation();
  const encodedSlug = location.pathname.slice("/pages/".length);
  let slug = encodedSlug;
  try { slug = decodeURIComponent(encodedSlug); } catch { /* Invalid encoding will return no match. */ }
  const [page, setPage] = useState<PublicContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setPage(null);
    setError("");
    getPublicPageByUrl(slug)
      .then((result) => {
        if (!active) return;
        if (!result) setError("This page was not found or is no longer public.");
        setPage(result);
      })
      .catch(() => {
        if (active) setError("The page content could not be loaded. Please try again later.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <article className="public-page" aria-labelledby="public-page-title">
      <p><Link to="/">Home</Link></p>
      {loading ? <p role="status">Loading page…</p> : null}
      {error ? (
        <section className="notice-card">
          <h1>Page unavailable</h1>
          <p role="alert">{error}</p>
          <Link to="/">Return home</Link>
        </section>
      ) : null}
      {page ? (
        <>
          <h1 id="public-page-title">{page.title}</h1>
          <div
            className="public-page-content"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content ?? "") }}
          />
          {!page.content?.trim() ? <p>This page has no content yet.</p> : null}
        </>
      ) : null}
    </article>
  );
}
