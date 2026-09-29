import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import "./App.css";
import AdminManager from "./admin/AdminManager";
import Homepage from "./public/Homepage";
import PageRenderer from "./components/PageRenderer";

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
    return <AdminManager />;
  }

  const parts = relativePath.split("/").filter(Boolean);
  const slug = parts[0] || "";

  if (!slug) {
    return <Homepage />;
  }

  return <DynamicPage slug={slug} />;
}

function DynamicPage({ slug }) {
  const [page, setPage] = useState(null);
  const [website, setWebsite] = useState(null);
  const [links, setLinks] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPage();
  }, [slug]);

  async function loadPage() {
    setLoading(true);

    const [
      pageResult,
      websiteResult,
      linksResult,
      photosResult,
      videosResult
    ] = await Promise.all([
      supabase
        .from("PageManagement")
        .select(
          "id, slug, title, content, content_type, cover_media, published"
        )
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle(),

      supabase
        .from("WebsiteInformation")
        .select(
          "id, website_name, logo_url, slogan, banner_url, banner_style"
        )
        .limit(1)
        .maybeSingle(),

      supabase
        .from("LinkManagement")
        .select(
          "id, label, url, root_domain, icon, enabled, footer_enabled, sort_order"
        )
        .eq("enabled", true)
        .eq("footer_enabled", true)
        .order("sort_order", { ascending: true }),

      supabase
        .from("PhotoManagement")
        .select(
          "id, title, description, category, media_url, published"
        )
        .eq("published", true)
        .order("created_at", { ascending: false }),

      supabase
        .from("VideoManagement")
        .select(
          "id, title, description, category, media_url, published"
        )
        .eq("published", true)
        .order("created_at", { ascending: false })
    ]);

    setPage(pageResult.data || null);
    setWebsite(websiteResult.data || null);
    setLinks(linksResult.data || []);
    setPhotos(photosResult.data || []);
    setVideos(videosResult.data || []);

    setLoading(false);
  }

  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  if (loading) {
    return (
      <div className="village-site">
        <main className="village-main-content">
          <div className="village-content-card">
            <p>Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="village-site">
        <main className="village-main-content">
          <div className="village-content-card">
            <h1>Page not found</h1>
            <a className="login-button" href={base}>
              Back to Home
            </a>
          </div>
        </main>
      </div>
    );
  }

  const siteName = website?.website_name || "";
  const logo = website?.logo_url || "";

  return (
    <div className="village-site">
      <header className="village-topbar">
        <div className="village-topbar-inner">
          <a className="village-brand" href={base}>
            {logo ? (
              <img
                className="village-brand-logo"
                src={logo}
                alt=""
              />
            ) : null}

            <span>{siteName}</span>
          </a>

          <div className="village-global-search">
            <a className="login-button" href={base}>
              Home
            </a>
          </div>

          <div className="village-top-actions">
            <a
              className="login-button"
              href={`${base}admin`}
            >
              Login
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="village-main-content">
          <div className="village-content-card">
            <div className="village-page-content">
              <PageRenderer
                page={page}
                photos={photos}
                videos={videos}
              />

              <div style={{ marginTop: "24px" }}>
                <a className="login-button" href={base}>
                  Back to Home
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="village-footer">
        <div className="village-footer-links">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              title={link.label}
              aria-label={link.label}
            >
              {link.icon ? (
                <img
                  src={link.icon}
                  alt=""
                  width="28"
                  height="28"
                />
              ) : (
                <span>{link.label}</span>
              )}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default App;
