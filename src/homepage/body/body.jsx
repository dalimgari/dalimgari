import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseclient";
import "../../app/app.css";
import PageRenderer from "../../components/pages/pagerenderer";
import AuthPanel from "../../components/AuthPanel";
import { trackVisit } from "../../lib/visitoranalytics";

function Homepage() {
  const [website, setWebsite] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [links, setLinks] = useState([]);
  const [pages, setPages] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomepage();
  }, []);

  async function loadHomepage() {
    setLoading(true);

    const [
      websiteResult,
      tabsResult,
      linksResult,
      pagesResult,
      photosResult,
      videosResult
    ] = await Promise.all([
      supabase
        .from("WebsiteInformation")
        .select(
          "id, website_name, logo_url, slogan, banner_url, banner_style"
        )
        .limit(1)
        .maybeSingle(),

      supabase
        .from("TabManagement")
        .select(
          "id, tab_key, page_id, sort_order, enabled"
        )
        .eq("enabled", true)
        .not("page_id", "is", null)
        .order("sort_order", { ascending: true }),

      supabase
        .from("LinkManagement")
        .select(
          "id, label, url, root_domain, icon, enabled, footer_enabled, sort_order"
        )
        .eq("enabled", true)
        .eq("footer_enabled", true)
        .order("sort_order", { ascending: true }),

      supabase
        .from("PageManagement")
        .select(
          "id, slug, title, content, content_type, cover_media, published"
        )
        .eq("published", true)
        .order("title", { ascending: true }),

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

    const pageList = pagesResult.data || [];
    const pageMap = new Map(
      pageList.map((page) => [page.id, page])
    );

    const validTabs = (tabsResult.data || []).filter(
      (tab) => pageMap.has(tab.page_id)
    );

    setWebsite(websiteResult.data || null);
    setTabs(validTabs);
    setLinks(linksResult.data || []);
    setPages(pageList);
    setPhotos(photosResult.data || []);
    setVideos(videosResult.data || []);

    setActiveTab(
      validTabs.length > 0
        ? validTabs[0].tab_key
        : ""
    );

    setLoading(false);
  }

  const currentTab = tabs.find(
    (tab) => tab.tab_key === activeTab
  );

  const currentPage =
    pages.find(
      (page) => page.id === currentTab?.page_id
    ) || null;

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return [];

    return pages
      .filter((page) => {
        const text = [
          page.title,
          page.slug,
          page.content
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(query);
      })
      .slice(0, 8);
  }, [pages, search]);

  function selectTab(tabKey) {
    setActiveTab(tabKey);

    requestAnimationFrame(() => {
      document
        .getElementById("village-content")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
    });
  }

  if (loading) {
    return (
      <div className="village-loading">
        <div>Loading...</div>
      </div>
    );
  }

  const siteName = website?.website_name || "";
  const slogan = website?.slogan || "";
  const logo = website?.logo_url || "";
  const bannerUrl = website?.banner_url || "";

  return (
    <div className="village-site">
      <header className="village-topbar">
        <div className="village-topbar-inner">
          <a
            className="village-brand"
            href={import.meta.env.BASE_URL}
          >
            {logo && (
              <img
                className="village-brand-logo"
                src={logo}
                alt=""
              />
            )}

            <span>{siteName}</span>
          </a>

          <div className="village-global-search">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search"
              aria-label="Global search"
            />

            {search && (
              <div className="village-search-results">
                {searchResults.length > 0 ? (
                  searchResults.map((page) => (
                    <a
                      key={page.id}
                      href={`${import.meta.env.BASE_URL}${page.slug}`}
                      onClick={() => setSearch("")}
                    >
                      {page.title}
                    </a>
                  ))
                ) : (
                  <span>No results found.</span>
                )}
              </div>
            )}
          </div>

          <div className="village-top-actions">
            <AuthPanel />
          </div>
        </div>
      </header>

      <section
        className="village-hero"
        style={{
          "--village-wallpaper": bannerUrl
            ? `url("${bannerUrl}")`
            : "none"
        }}
      >
        <div className="village-hero-overlay" />

        <div className="village-hero-content">
          <h1>{siteName}</h1>
          <p>{slogan}</p>
        </div>
      </section>

      <main>
        <section
          id="village-content"
          className="village-main-content"
        >
          <div className="village-content-card">
            {tabs.length > 0 && (
              <nav
                className="village-tabs"
                aria-label="Homepage tabs"
              >
                {tabs.map((tab) => {
                  const page = pages.find(
                    (item) => item.id === tab.page_id
                  );

                  return (
                    <button
                      type="button"
                      key={tab.id}
                      className={
                        activeTab === tab.tab_key
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        selectTab(tab.tab_key)
                      }
                    >
                      {page?.title || tab.tab_key}
                    </button>
                  );
                })}
              </nav>
            )}

            <div className="village-page-content">
              {currentPage ? (
                <PageRenderer
                  page={currentPage}
                  photos={photos}
                  videos={videos}
                />
              ) : (
                <div className="village-empty">
                  <p>No page is currently available.</p>
                </div>
              )}
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
                <span>
                  {link.label || link.root_domain}
                </span>
              )}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default Homepage;
