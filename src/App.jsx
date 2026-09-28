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
  const [settings, setSettings] = useState({});
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPage();
  }, [slug]);

  async function loadPage() {
    setLoading(true);

    const [pageResult, settingsResult, linksResult] =
      await Promise.all([
        supabase
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
          .maybeSingle(),

        supabase
          .from("site_settings")
          .select("*")
          .order("created_at", { ascending: true }),

        supabase
          .from("global_links")
          .select("*")
          .eq("enabled", true)
          .order("sort_order", { ascending: true })
      ]);

    const settingsMap = {};

    (settingsResult.data || []).forEach((item) => {
      const value =
        typeof item.value === "string"
          ? item.value
          : item.value?.value || "";

      settingsMap[item.key] = value;
    });

    setPage(pageResult.data || null);
    setSettings(settingsMap);
    setLinks(linksResult.data || []);
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

  const siteName =
    settings.site_name ||
    settings.site_title ||
    "";

  const logo =
    settings.site_logo ||
    settings.logo_url ||
    "";

  const copyright =
    settings.copyright ||
    settings.site_copyright ||
    "";

  const pageUrl = `${base}${page.slug}`;

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
            <a
              className="login-button"
              href={base}
            >
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
              <h1>{page.title}</h1>

              <PageRenderer page={page} />

              <div style={{ marginTop: "24px" }}>
                <a
                  className="login-button"
                  href={base}
                >
                  Back to Home
                </a>
              </div>

              <div style={{ marginTop: "16px" }}>
                <small>{pageUrl}</small>
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
              title={link.label || link.root_domain}
              aria-label={link.label || link.root_domain}
            >
              {link.icon ? (
                <img
                  src={link.icon}
                  alt=""
                  width="28"
                  height="28"
                />
              ) : (
                <span>{link.root_domain}</span>
              )}
            </a>
          ))}
        </div>

        {copyright && (
          <div className="village-footer-copyright">
            {copyright}
          </div>
        )}
      </footer>
    </div>
  );
}

export default App;
