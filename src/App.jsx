import AuthPanel from "./public/AuthPanel";
import PostInteractions from "./public/PostInteractions";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import "./App.css";
import Admin from "./admin/Admin";

function App() {
  const pathname = window.location.pathname;
  const isAdmin = pathname.startsWith("/admin");
  const pageSlug = pathname.split("/").filter(Boolean)[0] || "";

  if (isAdmin) {
    return <Admin />;
  }

  if (pageSlug) {
    return <DynamicPage slug={pageSlug} />;
  }

  return <PublicSite />;
}

function DynamicPage({ slug }) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      setError("");

      const { data, error: pageError } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();

      if (pageError) {
        setError(pageError.message);
      } else if (!data) {
        setError("Page not found.");
      } else {
        setPage(data);
      }

      setLoading(false);
    }

    loadPage();
  }, [slug]);

  if (loading) {
    return <div className="app"><main className="section"><div className="container"><p>Loading...</p></div></main></div>;
  }

  if (error || !page) {
    return <div className="app"><main className="section"><div className="container"><h1>Page not found</h1><p>{error}</p><a href="/">Back to Home</a></div></main></div>;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <a className="brand" href="/">
            <span className="brand-mark">D</span>
            <span>Community</span>
          </a>
          <nav className="nav">
            <a href="/">Home</a>
            <a href="/admin">Admin</a>
          </nav>
        </div>
      </header>

    <main>
        <section className="section">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Community Page</p>
              <h1>{page.title}</h1>
            </div>

            {page.cover_image && (
              <img
                src={page.cover_image}
                alt={page.title}
                className="card-image"
              />
            )}

            <div className="page-content">
              {(page.content || "").split(/\n\s*\n/).map((paragraph, index) => (
                <p key={index}>
                  {paragraph.split("\n").map((line, lineIndex) => (
                    <span key={lineIndex}>
                      {line}
                      {lineIndex < paragraph.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </p>
              ))}
            </div>

            <a className="button secondary" href="/">
              Back to Home
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span>Community</span>
          <span>Digital Community Platform</span>
        </div>
      </footer>
    </div>
  );
}

function PublicSite() {
  const [siteSettings, setSiteSettings] = useState([]);
  const [aboutPage, setAboutPage] = useState(null);
  const [pages, setPages] = useState([]);
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactStatus, setContactStatus] = useState("");
  const [contactSending, setContactSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    loadPublicData();
  }, []);

  async function loadPublicData() {
    setLoading(true);

    const [
      settingsResult,
      newsResult,
      eventsResult,
      galleryResult,
      announcementsResult,
      documentsResult,
      postsResult,
      pagesResult
    ] = await Promise.all([
      supabase
        .from("site_settings")
        .select("*")
        .order("created_at", { ascending: true }),

      supabase
        .from("news")
        .select("*")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(6),

      supabase
        .from("events")
        .select("*")
        .eq("published", true)
        .order("start_at", { ascending: true })
        .limit(6),

      supabase
        .from("gallery")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(8),

      supabase
        .from("announcements")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(6),

      supabase
        .from("documents")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(10),

      supabase
        .from("posts")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(10),

      supabase
        .from("pages")
        .select("id, slug, title")
        .eq("published", true)
        .order("created_at", { ascending: true })
    ]);

    if (!settingsResult.error) {
      setSiteSettings(settingsResult.data || []);
    }

    if (!newsResult.error) {
      setNews(newsResult.data || []);
    }

    if (!eventsResult.error) {
      setEvents(eventsResult.data || []);
    }

    if (!galleryResult.error) {
      setGallery(galleryResult.data || []);
    }

    if (!announcementsResult.error) {
      setAnnouncements(announcementsResult.data || []);
    }

    if (!documentsResult.error) {
      setDocuments(documentsResult.data || []);
    }

    if (!postsResult.error) {
      setPosts(postsResult.data || []);
    }

    if (!pagesResult.error) {
      const pageData = pagesResult.data || [];
      setPages(pageData);

      const about =
        pageData.find((page) => page.slug === "about") ||
        pageData.find((page) => page.slug === "intro") ||
        null;

      setAboutPage(about);
    }

    setLoading(false);
  }

  async function submitContact(event) {
    event.preventDefault();

    setContactSending(true);
    setContactStatus("");

    const { error } = await supabase.from("contact_messages").insert({
      name: contactName.trim(),
      email: contactEmail.trim() || null,
      phone: contactPhone.trim() || null,
      subject: contactSubject.trim() || null,
      message: contactMessage.trim()
    });

    if (error) {
      setContactStatus(error.message);
    } else {
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactSubject("");
      setContactMessage("");
      setContactStatus("Your message has been sent successfully.");
    }

    setContactSending(false);
  }

  const settingMap = Object.fromEntries(
    siteSettings.map((item) => [
      item.key,
      typeof item.value === "string"
        ? item.value
        : item.value?.value || ""
    ])
  );

  const siteName = settingMap.site_name || "";
  const siteTagline = settingMap.site_tagline || "";
  const siteDescription = settingMap.site_description || "";
  const contactEmailSetting = settingMap.contact_email || "";
  const contactPhoneSetting = settingMap.contact_phone || "";
  const addressSetting = settingMap.address || "";
  const facebookUrl = settingMap.facebook_url || "";
  const youtubeUrl = settingMap.youtube_url || "";
  const tiktokUrl = settingMap.tiktok_url || "";
  const websiteUrl = settingMap.website_url || "";
  const mapUrl = settingMap.map_url || "";

  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <a className="brand" href="/">
            <span className="brand-mark">D</span>
            <span>{siteName}</span>
          </a>

          <nav className="nav">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#news">News</a>
            <a href="#events">Events</a>
            <a href="#gallery">Gallery</a>
            <a href="#contact">Contact</a>

            {pages.map((page) => (
              <a key={page.id} href={"/" + page.slug}>
                {page.title}
              </a>
            ))}

            <li className="nav-account">
              <AuthPanel />
            </li>
          </nav>
        </div>
      </header>

      <main>
        <section id="home" className="hero">
          <div className="container hero-content">
            <p className="eyebrow">Digital Community Platform</p>
            <h1>{siteName}</h1>
            <p className="hero-text">
              {siteTagline || siteDescription}
            </p>

            <div className="hero-actions">
              <a className="button primary" href="#about">
                Explore Community
              </a>
              <a className="button secondary" href="#contact">
                Contact
              </a>
            </div>
          </div>
        </section>

        <section id="about" className="section">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Community</p>
              <h2>{aboutPage?.title || siteName}</h2>
              <p>{aboutPage?.content || siteDescription}</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <strong>01</strong>
                <span>Community</span>
              </div>
              <div className="stat-card">
                <strong>01</strong>
                <span>Digital Hub</span>
              </div>
              <div className="stat-card">
                <strong>24/7</strong>
                <span>Online Access</span>
              </div>
              <div className="stat-card">
                <strong>∞</strong>
                <span>Future Growth</span>
              </div>
            </div>
          </div>
        </section>

        <section id="news" className="section section-muted">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Updates</p>
              <h2>Latest News</h2>
            </div>

            {loading ? (
              <div className="empty-state">Loading...</div>
            ) : news.length === 0 ? (
              <div className="empty-state">
                No published news available.
              </div>
            ) : (
              <div className="card-grid">
                {news.map((item) => (
                  <article className="content-card" key={item.id}>
                    {item.cover_image && (
                      <img
                        src={item.cover_image}
                        alt={item.title}
                        className="card-image"
                      />
                    )}
                    <div className="card-body">
                      <h3>{item.title}</h3>
                      <p>{item.excerpt || "Read the latest community update."}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="events" className="section">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Activities</p>
              <h2>Upcoming Events</h2>
            </div>

            {loading ? (
              <div className="empty-state">Loading...</div>
            ) : events.length === 0 ? (
              <div className="empty-state">
                No upcoming events available.
              </div>
            ) : (
              <div className="card-grid">
                {events.map((item) => (
                  <article className="content-card" key={item.id}>
                    {item.cover_image && (
                      <img
                        src={item.cover_image}
                        alt={item.title}
                        className="card-image"
                      />
                    )}
                    <div className="card-body">
                      <h3>{item.title}</h3>
                      <p>{item.description || "Community event."}</p>
                      {item.location && <small>{item.location}</small>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="gallery" className="section section-muted">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Media</p>
              <h2>Community Gallery</h2>
            </div>

            {loading ? (
              <div className="empty-state">Loading...</div>
            ) : gallery.length === 0 ? (
              <div className="empty-state">
                No gallery items available.
              </div>
            ) : (
              <div className="gallery-grid">
                {gallery.map((item) => (
                  <div className="gallery-item" key={item.id}>
                    {item.media_type === "video" ? (
                      <video
                        src={item.media_url}
                        controls
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={item.media_url}
                        alt={item.title || "Gallery"}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="posts" className="section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Community</p>
            <h2>Posts</h2>
          </div>

          {loading ? (
            <div className="empty-state">Loading...</div>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              No published posts available.
            </div>
          ) : (
            <div className="card-grid">
              {posts.map((item) => (
                <article className="content-card" key={item.id}>
                  <div className="card-body">
                    <p>{item.content}</p>

                    {item.image_url && item.media_type === "video" && (
                      <video
                        src={item.image_url}
                        controls
                        preload="metadata"
                      />
                    )}

                    {item.image_url && item.media_type !== "video" && (
                      <img
                        src={item.image_url}
                        alt="Post"
                      />
                    )}

                    <small>
                      {new Date(item.created_at).toLocaleString()}
                    </small>

                    <PostInteractions postId={item.id} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="documents" className="section section-muted">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Resources</p>
              <h2>Documents</h2>
            </div>

            {loading ? (
              <div className="empty-state">Loading...</div>
            ) : documents.length === 0 ? (
              <div className="empty-state">
                No published documents available.
              </div>
            ) : (
              <div className="card-grid">
                {documents.map((item) => (
                  <article className="content-card" key={item.id}>
                    <div className="card-body">
                      <h3>{item.title}</h3>
                      {item.description && <p>{item.description}</p>}
                      <small>{item.file_type || "Document"}</small>
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Document
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="contact" className="section contact-section">
          <div className="container contact-box">
            <div className="section-heading">
              <p className="eyebrow">Connect</p>
              <h2>Community Contact</h2>
              <p>
                Send a message to the community administration.
              </p>
            </div>

            <div className="contact-details">
              {contactEmailSetting && <p>{contactEmailSetting}</p>}
              {contactPhoneSetting && <p>{contactPhoneSetting}</p>}
              {addressSetting && <p>{addressSetting}</p>}
            </div>

            <form className="contact-form" onSubmit={submitContact}>
              <div className="contact-form-grid">
                <input
                  type="text"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  placeholder="Your name"
                  required
                />

                <input
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="Email address"
                />

                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  placeholder="Phone number"
                />

                <input
                  type="text"
                  value={contactSubject}
                  onChange={(event) => setContactSubject(event.target.value)}
                  placeholder="Subject"
                />
              </div>

              <textarea
                value={contactMessage}
                onChange={(event) => setContactMessage(event.target.value)}
                placeholder="Your message"
                rows="6"
                required
              />

              <button
                className="button primary"
                type="submit"
                disabled={contactSending}
              >
                {contactSending ? "Sending..." : "Send Message"}
              </button>

              {contactStatus && (
                <p className="contact-status">{contactStatus}</p>
              )}
            </form>

            {(facebookUrl || youtubeUrl || tiktokUrl || websiteUrl || mapUrl) && (
              <div className="contact-links">
                {facebookUrl && (
                  <a href={facebookUrl} target="_blank" rel="noreferrer">
                    Facebook
                  </a>
                )}
                {youtubeUrl && (
                  <a href={youtubeUrl} target="_blank" rel="noreferrer">
                    YouTube
                  </a>
                )}
                {tiktokUrl && (
                  <a href={tiktokUrl} target="_blank" rel="noreferrer">
                    TikTok
                  </a>
                )}
                {websiteUrl && (
                  <a href={websiteUrl} target="_blank" rel="noreferrer">
                    Website
                  </a>
                )}
                {mapUrl && (
                  <a href={mapUrl} target="_blank" rel="noreferrer">
                    Google Map
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span>{siteName}</span>
          <span>Digital Community Platform</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
