import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./Homepage.css";
import PageRenderer from "../components/PageRenderer";
import AuthPanel from "../components/AuthPanel";
import { trackVisit } from "../lib/visitorAnalytics";

function readSetting(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return value.value || "";
  }
  return "";
}

function getLocalized(settings, base, language) {
  const localized =
    settings[`${base}_${language}`] ||
    settings[base] ||
    "";
  return readSetting(localized);
}

function Homepage({ language, onLanguageChange }) {
  useEffect(() => {
    let active = true;

    async function recordVisit() {
      const { data } = await supabase.auth.getSession();

      if (active) {
        await trackVisit(data.session?.user?.id || null);
      }
    }

    recordVisit();

    return () => {
      active = false;
    };
  }, []);
  const [settings, setSettings] = useState({});
  const [tabs, setTabs] = useState([]);
  const [links, setLinks] = useState([]);
  const [pages, setPages] = useState([]);
  const [activeTab, setActiveTab] = useState("");
  const [localLanguage, setLocalLanguage] = useState(language || "bn");

  useEffect(() => {
    setLocalLanguage(language || "bn");
  }, [language]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomepage();
  }, []);

  async function loadHomepage() {
    setLoading(true);

    const [
      settingsResult,
      tabsResult,
      linksResult,
      pagesResult
    ] = await Promise.all([
      supabase
        .from("site_settings")
        .select("*")
        .order("created_at", { ascending: true }),

      supabase
        .from("site_tabs")
        .select(`
          id,
          tab_key,
          title_bn,
          title_en,
          page_id,
          sort_order,
          enabled,
          pages (
            id,
            slug,
            title,
            title_bn,
            title_en,
            content,
            content_bn,
            content_en,
            content_type,
            cover_image,
            published
          )
        `)
        .eq("enabled", true)
        .not("page_id", "is", null)
        .order("sort_order", { ascending: true }),

      supabase
        .from("global_links")
        .select("*")
        .eq("enabled", true)
        .order("sort_order", { ascending: true }),

      supabase
        .from("pages")
        .select("id, slug, title, content, content_type, published")
        .eq("published", true)
        .order("title", { ascending: true })
    ]);

    const settingsMap = {};

    (settingsResult.data || []).forEach((item) => {
      settingsMap[item.key] = readSetting(item.value);
    });

    const validTabs = (tabsResult.data || []).filter(
      (tab) => tab.pages && tab.pages.published !== false
    );

    setSettings(settingsMap);
    setTabs(validTabs);
    setLinks(linksResult.data || []);
    setPages(pagesResult.data || []);

    setActiveTab(
      validTabs.length > 0 ? validTabs[0].tab_key : ""
    );

    setLoading(false);
  }

  const siteName =
    getLocalized(settings, "site_name", localLanguage) ||
    getLocalized(settings, "site_title", localLanguage);

  const tagline =
    getLocalized(settings, "site_tagline", localLanguage);

  const logo =
    settings.site_logo ||
    settings.logo_url ||
    "";

  const wallpaper =
    settings.hero_wallpaper ||
    settings.village_wallpaper ||
    "";

  const wallpaperStyle =
    settings.wallpaper_style || "classic";

  const copyright =
    settings.copyright ||
    settings.site_copyright ||
    "";

  const currentTab = tabs.find(
    (tab) => tab.tab_key === activeTab
  );

  const currentPage = currentTab?.pages || null;

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

  function renderPageContent() {
    if (!currentPage) {
      return (
        <div className="village-empty">
          <p>No page is currently available.</p>
        </div>
      );
    }

    return <PageRenderer page={currentPage} language={localLanguage} />;
  }

  if (loading) {
    return (
      <div className="village-loading">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="village-site">
      <header className="village-topbar">
        <div className="village-topbar-inner">
          <a
            className="village-brand"
            href={import.meta.env.BASE_URL}
          >
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
            <button
              type="button"
              className="language-switch"
              onClick={() =>
                setLocalLanguage((current) => {
                  const next = current === "bn" ? "en" : "bn";
                  onLanguageChange?.(next);
                  return next;
                })
              }
            >
              {localLanguage === "bn" ? "English" : "বাংলা"}
            </button>

            <AuthPanel language={localLanguage} onLanguageChange={onLanguageChange} />
          </div>
        </div>
      </header>

      <main>
        <section
          className={`village-hero wallpaper-${wallpaperStyle}`}
          style={{
            "--village-wallpaper": wallpaper
              ? `url("${wallpaper}")`
              : "none"
          }}
        >
          <div className="village-hero-overlay" />

          <div className="village-hero-content">
            <h1>{siteName}</h1>
            <p>{tagline}</p>
          </div>
        </section>

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
                {tabs.map((tab) => (
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
                    {localLanguage === "en" ? (tab.title_en || tab.pages?.title_en || tab.title_bn || tab.pages?.title || "") : (tab.title_bn || tab.pages?.title_bn || tab.title_en || tab.pages?.title || "")}
                  </button>
                ))}
              </nav>
            )}

            <div className="village-page-content">
              {renderPageContent()}
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
              title={localLanguage === "en" ? (link.label_en || link.label_bn || link.label || link.root_domain) : (link.label_bn || link.label_en || link.label || link.root_domain)}
              aria-label={localLanguage === "en" ? (link.label_en || link.label_bn || link.label || link.root_domain) : (link.label_bn || link.label_en || link.label || link.root_domain)}
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

export default Homepage;
