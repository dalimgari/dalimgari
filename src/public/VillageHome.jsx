import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import "./VillageHome.css";

const DEFAULT_TABS = [
  { id: "home", label: "মূল পাতা", type: "home" },
  { id: "details", label: "বিস্তারিত তথ্য", type: "article" },
  { id: "nature", label: "প্রকৃতি ও দৃশ্যাবলী", type: "gallery" },
  { id: "people", label: "গ্রামবাসী", type: "people" },
  { id: "photos", label: "ফটো গ্যালারী", type: "gallery" },
  { id: "videos", label: "ভিডিও গ্যালারী", type: "video" }
];

function VillageHome() {
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState("home");
  const [language, setLanguage] = useState("bn");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .order("created_at", { ascending: true });

    const map = {};

    (data || []).forEach((item) => {
      map[item.key] =
        typeof item.value === "string"
          ? item.value
          : item.value?.value || "";
    });

    setSettings(map);
    setLoading(false);
  }

  const siteName = settings.site_name || "";
  const tagline = settings.site_tagline || "";
  const description = settings.site_description || "";

  const wallpaper = settings.hero_wallpaper || settings.village_wallpaper || "";

  const wallpaperStyle = settings.wallpaper_style || "classic";

  const tabs = useMemo(() => {
    try {
      const configured = settings.home_tabs
        ? JSON.parse(settings.home_tabs)
        : null;

      if (Array.isArray(configured) && configured.length) {
        return configured.filter((tab) => tab.enabled !== false);
      }
    } catch {
      // Use defaults when stored configuration is invalid.
    }

    return DEFAULT_TABS;
  }, [settings.home_tabs]);

  const text =
    language === "bn"
      ? {
          login: "লগইন",
          home: "মূল পাতা",
          explore: "গ্রামকে জানুন",
          language: "English",
          welcome: "স্বাগতম",
          details: "ডালিমগাড়ী সম্পর্কে",
          detailsText:
            "এই গ্রামের ইতিহাস, মানুষ, প্রকৃতি ও জীবনযাত্রার তথ্য ধীরে ধীরে এখানে যুক্ত করা হবে।",
          empty: "এই অংশের তথ্য শীঘ্রই যুক্ত করা হবে।"
        }
      : {
          login: "Login",
          home: "Home",
          explore: "Explore Village",
          language: "বাংলা",
          welcome: "Welcome",
          details: "About Dalimgari",
          detailsText:
            "Information about the village, its people, nature and everyday life will be added here.",
          empty: "Information for this section will be added soon."
        };

  function selectTab(id) {
    setActiveTab(id);

    requestAnimationFrame(() => {
      document
        .getElementById("village-content")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function renderContent() {
    if (activeTab === "home") {
      return (
        <section className="village-content-card home-content">
          <span className="village-section-kicker">{text.welcome}</span>
          <h2>{siteName}</h2>
          <p>{description}</p>

          <div className="village-info-grid">
            <div>
              <strong>গ্রাম</strong>
              <span>{siteName}</span>
            </div>
            <div>
              <strong>পরিচয়</strong>
              <span>{tagline}</span>
            </div>
            <div>
              <strong>তথ্যভাণ্ডার</strong>
              <span>ক্রমে সমৃদ্ধ হচ্ছে</span>
            </div>
          </div>
        </section>
      );
    }

    if (activeTab === "details") {
      return (
        <section className="village-content-card article-content">
          <span className="village-section-kicker">বিস্তারিত</span>
          <h2>{text.details}</h2>
          <p>{text.detailsText}</p>
        </section>
      );
    }

    return (
      <section className="village-content-card">
        <span className="village-section-kicker">
          {tabs.find((tab) => tab.id === activeTab)?.label}
        </span>
        <h2>{tabs.find((tab) => tab.id === activeTab)?.label}</h2>
        <p>{text.empty}</p>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="village-loading">
        <div>লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="village-site">
      <header className="village-topbar">
        <div className="village-topbar-inner">
          <a className="village-brand" href={import.meta.env.BASE_URL}>
            <span className="village-brand-mark">দা</span>
            <span>{siteName}</span>
          </a>

          <div className="village-top-actions">
            <button
              type="button"
              className="language-switch"
              onClick={() =>
                setLanguage((current) => (current === "bn" ? "en" : "bn"))
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
          style={{ "--village-wallpaper": `url("${wallpaper}")` }}
        >
          <div className="village-hero-overlay" />

          <div className="village-hero-content">
            <span className="village-hero-kicker">{tagline}</span>
            <h1>{siteName}</h1>
            <p>{description}</p>

            <button
              type="button"
              className="hero-explore-button"
              onClick={() => selectTab("home")}
            >
              {text.explore}
            </button>
          </div>
        </section>

        <div className="village-tabs-wrap">
          <nav className="village-tabs" aria-label="Village sections">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                className={activeTab === tab.id ? "active" : ""}
                onClick={() => selectTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <section id="village-content" className="village-main-content">
          {renderContent()}
        </section>
      </main>

      <footer className="village-footer">
        <strong>{siteName}</strong>
        <span>আমাদের গ্রাম, আমাদের পরিচয়</span>
      </footer>
    </div>
  );
}

export default VillageHome;
