import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./VillageHome.css";
import PageRenderer from "./PageRenderer";

function VillageHome() {
  const [settings, setSettings] = useState({});
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState("");
  const [language, setLanguage] = useState("bn");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomepage();
  }, []);

  async function loadHomepage() {
    setLoading(true);

    const [settingsResult, tabsResult] = await Promise.all([
      supabase
        .from("site_settings")
        .select("*")
        .order("created_at", { ascending: true }),

      supabase
        .from("site_tabs")
        .select(`
          id,
          tab_key,
          page_id,
          sort_order,
          enabled,
          pages (
            id,
            slug,
            title,
            content,
            content_type,
            cover_image,
            published
          )
        `)
        .eq("enabled", true)
        .not("page_id", "is", null)
        .order("sort_order", { ascending: true })
    ]);

    const settingsMap = {};

    (settingsResult.data || []).forEach((item) => {
      settingsMap[item.key] =
        typeof item.value === "string"
          ? item.value
          : item.value?.value || "";
    });

    const validTabs = (tabsResult.data || []).filter(
      (tab) =>
        tab.pages &&
        tab.pages.published !== false
    );

    setSettings(settingsMap);
    setTabs(validTabs);

    if (validTabs.length > 0) {
      setActiveTab(validTabs[0].tab_key);
    } else {
      setActiveTab("");
    }

    setLoading(false);
  }

  const siteName = settings.site_name || "";
  const tagline = settings.site_tagline || "";
  const description = settings.site_description || "";

  const wallpaper =
    settings.hero_wallpaper ||
    settings.village_wallpaper ||
    "";

  const wallpaperStyle =
    settings.wallpaper_style || "classic";

  const currentTab = tabs.find(
    (tab) => tab.tab_key === activeTab
  );

  const currentPage = currentTab?.pages || null;

  const text =
    language === "bn"
      ? {
          login: "লগইন",
          language: "English",
          explore: "আরও দেখুন",
          loading: "লোড হচ্ছে...",
          empty: "এই পেজে এখনো কোনো তথ্য যুক্ত করা হয়নি।",
          back: "হোম"
        }
      : {
          login: "Login",
          language: "বাংলা",
          explore: "Explore",
          loading: "Loading...",
          empty: "No information has been added to this page yet.",
          back: "Home"
        };

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
        <section className="village-content-card">
          <p>{text.empty}</p>
        </section>
      );
    }

    return (
      <section className="village-content-card">
        <PageRenderer page={currentPage} />

        <a
          className="village-page-link"
          href={`${import.meta.env.BASE_URL}${currentPage.slug}`}
        >
          {text.explore}
        </a>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="village-loading">
        <div>{text.loading}</div>
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
            <span className="village-brand-mark">
              দা
            </span>

            <span>{siteName}</span>
          </a>

          <div className="village-top-actions">
            <button
              type="button"
              className="language-switch"
              onClick={() =>
                setLanguage((current) =>
                  current === "bn" ? "en" : "bn"
                )
              }
            >
              {text.language}
            </button>

            <a
              className="login-button"
              href={`${import.meta.env.BASE_URL}admin`}
            >
              {text.login}
            </a>
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
            <span className="village-hero-kicker">
              {tagline}
            </span>

            <h1>{siteName}</h1>

            <p>{description}</p>

            {tabs.length > 0 && (
              <button
                type="button"
                className="hero-explore-button"
                onClick={() =>
                  selectTab(tabs[0].tab_key)
                }
              >
                {text.explore}
              </button>
            )}
          </div>
        </section>

        {tabs.length > 0 && (
          <div className="village-tabs-wrap">
            <nav
              className="village-tabs"
              aria-label="Village sections"
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
                  {tab.pages?.title || ""}
                </button>
              ))}
            </nav>
          </div>
        )}

        <section
          id="village-content"
          className="village-main-content"
        >
          {renderPageContent()}
        </section>
      </main>

      <footer className="village-footer">
        <strong>{siteName}</strong>
        <span>{tagline}</span>
      </footer>
    </div>
  );
}

export default VillageHome;
