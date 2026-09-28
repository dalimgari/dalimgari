import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import "./App.css";
import Admin from "./admin/Admin";
import VillageHome from "./public/VillageHome";
import PageRenderer from "./public/PageRenderer";

function App() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const pathname = window.location.pathname;

  const relativePath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname;

  const isAdmin =
    relativePath === "/admin" ||
    relativePath.startsWith("/admin/");

  if (isAdmin) {
    return <Admin />;
  }

  const parts = relativePath
    .split("/")
    .filter(Boolean);

  const slug = parts[0] || "";

  if (!slug) {
    return <VillageHome />;
  }

  return <DynamicPage slug={slug} />;
}

function DynamicPage({ slug }) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPage();
  }, [slug]);

  async function loadPage() {
    setLoading(true);

    const { data } = await supabase
      .from("pages")
      .select(`
        id,
        slug,
        title,
        content,
        content_type,
        cover_image,
        published
      `)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    setPage(data || null);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="app">
        <main className="section">
          <div className="container">
            <p>Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="app">
        <main className="section">
          <div className="container">
            <h1>Page not found</h1>
            <a href={import.meta.env.BASE_URL}>Back to Home</a>
          </div>
        </main>
      </div>
    );
  }

  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  const pageUrl = `${base}${page.slug}`;

  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <a className="brand" href={base}>
            <span className="brand-mark">
              {page.title.slice(0, 1)}
            </span>
            <span>{page.title}</span>
          </a>

          <nav className="nav">
            <a href={base}>Home</a>
            <a href={`${base}admin`}>Admin</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="section">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">
                {page.content_type}
              </p>
              <h1>{page.title}</h1>
            </div>

            <PageRenderer page={page} />

            <div>
              <a
                className="button secondary"
                href={base}
              >
                Back to Home
              </a>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <small>{pageUrl}</small>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span>{page.title}</span>
          <span>{pageUrl}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
