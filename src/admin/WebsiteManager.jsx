import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import MediaInput from "../components/MediaInput";

const STYLES = [
  "classic",
  "soft",
  "dark",
  "warm",
  "nature",
  "black-fade"
];

function WebsiteManager({ onBack }) {
  const [wallpaper, setWallpaper] = useState("");
  const [style, setStyle] = useState("classic");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data } = await supabase
      .from("WebsiteInformation")
      .select("key,value")
      .in("key", ["hero_wallpaper", "wallpaper_style"]);

    (data || []).forEach((item) => {
      const value =
        typeof item.value === "string"
          ? item.value
          : item.value?.value || "";

      if (item.key === "hero_wallpaper") setWallpaper(value);
      if (item.key === "wallpaper_style") setStyle(value || "classic");
    });
  }

  async function saveSetting(key, value) {
    return supabase.from("WebsiteInformation").upsert(
      {
        key,
        value: { value },
        updated_at: new Date().toISOString()
      },
      { onConflict: "key" }
    );
  }

  async function save() {
    setSaving(true);
    setMessage("");

    const [wallpaperResult, styleResult] = await Promise.all([
      saveSetting("hero_wallpaper", wallpaper),
      saveSetting("wallpaper_style", style)
    ]);

    if (wallpaperResult.error || styleResult.error) {
      setMessage(
        wallpaperResult.error?.message ||
          styleResult.error?.message ||
          "Unable to save customization."
      );
    } else {
      setMessage("Customization saved successfully.");
    }

    setSaving(false);
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">Administration</p>
          <h1>Customization</h1>
        </div>

        <div className="admin-header-actions">
          <button onClick={onBack}>Dashboard</button>
        </div>
      </header>

      <section className="admin-content">
        <div className="admin-welcome">
          <h2>Hero Wallpaper</h2>
          <p>Choose the homepage wallpaper and visual style.</p>
        </div>

        <div className="admin-form">
          <label>
            Wallpaper
            <MediaInput
              value={wallpaper}
              onChange={setWallpaper}
              folder="hero"
              accept="image/*"
            />
          </label>

          <label>
            Wallpaper Style
            <select
              value={style}
              onChange={(event) => setStyle(event.target.value)}
            >
              {STYLES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          {wallpaper && (
            <div className={`customization-preview wallpaper-${style}`}>
              <img src={wallpaper} alt="Wallpaper preview" />
            </div>
          )}

          <button
            type="button"
            className="admin-primary-button"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Customization"}
          </button>

          {message && <p>{message}</p>}
        </div>
      </section>
    </main>
  );
}

export default WebsiteManager;
