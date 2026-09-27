import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function SettingsManager() {
  const [settings, setSettings] = useState({
    site_name: "",
    site_tagline: "",
    site_description: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    facebook_url: "",
    youtube_url: "",
    tiktok_url: "",
    website_url: "",
    map_url: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("site_settings")
      .select("*");

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const next = { ...settings };

    (data || []).forEach((item) => {
      if (Object.prototype.hasOwnProperty.call(next, item.key)) {
        next[item.key] =
          typeof item.value === "string"
            ? item.value
            : item.value?.value || "";
      }
    });

    setSettings(next);
    setLoading(false);
  }

  function updateField(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value
    }));
  }

  function normalizeUrl(value) {
    const trimmed = value.trim();

    if (!trimmed) {
      return "";
    }

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    return `https://${trimmed}`;
  }

  async function saveSetting(key, value) {
    if ([
      "facebook_url",
      "youtube_url",
      "tiktok_url",
      "website_url",
      "map_url"
    ].includes(key)) {
      value = normalizeUrl(value);
    }
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        {
          key,
          value: { value },
          updated_at: new Date().toISOString()
        },
        { onConflict: "key" }
      );

    if (error) {
      throw error;
    }
  }

  async function saveSettings(event) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      for (const [key, value] of Object.entries(settings)) {
        await saveSetting(key, value);
      }

      setMessage("Settings saved successfully.");
    } catch (err) {
      setError(err.message || "Failed to save settings.");
    }

    setSaving(false);
  }

  if (loading) {
    return <p>Loading settings...</p>;
  }

  return (
    <section>
      <div className="manager-header">
        <div>
          <p className="admin-eyebrow">Configuration</p>
          <h2>Website Settings</h2>
        </div>

        <a href="/admin" className="manager-back">
          Dashboard
        </a>
      </div>

      <form className="manager-form" onSubmit={saveSettings}>
        <label>
          Website Name
          <input
            value={settings.site_name}
            onChange={(event) =>
              updateField("site_name", event.target.value)
            }
          />
        </label>

        <label>
          Tagline
          <input
            value={settings.site_tagline}
            onChange={(event) =>
              updateField("site_tagline", event.target.value)
            }
          />
        </label>

        <label>
          Website Description
          <textarea
            rows="4"
            value={settings.site_description}
            onChange={(event) =>
              updateField("site_description", event.target.value)
            }
          />
        </label>

        <label>
          Contact Email
          <input
            type="email"
            value={settings.contact_email}
            onChange={(event) =>
              updateField("contact_email", event.target.value)
            }
          />
        </label>

        <label>
          Contact Phone
          <input
            value={settings.contact_phone}
            onChange={(event) =>
              updateField("contact_phone", event.target.value)
            }
          />
        </label>

        <label>
          Address
          <textarea
            rows="3"
            value={settings.address}
            onChange={(event) =>
              updateField("address", event.target.value)
            }
          />
        </label>

        <label>
          Facebook URL
          <input
            type="text"
            value={settings.facebook_url.replace(/^https?:\/\//i, "")}
            onChange={(event) =>
              updateField("facebook_url", event.target.value)
            }
          />
        </label>

        <label>
          YouTube URL
          <input
            type="text"
            value={settings.youtube_url.replace(/^https?:\/\//i, "")}
            onChange={(event) =>
              updateField("youtube_url", event.target.value)
            }
          />
        </label>

        <label>
          TikTok URL
          <input
            type="text"
            value={settings.tiktok_url.replace(/^https?:\/\//i, "")}
            onChange={(event) =>
              updateField("tiktok_url", event.target.value)
            }
          />
        </label>

        <label>
          Website URL
          <input
            type="text"
            value={settings.website_url.replace(/^https?:\/\//i, "")}
            onChange={(event) =>
              updateField("website_url", event.target.value)
            }
          />
        </label>

        <label>
          Google Map URL
          <input
            type="text"
            value={settings.map_url.replace(/^https?:\/\//i, "")}
            onChange={(event) =>
              updateField("map_url", event.target.value)
            }
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </button>

        {message && <p className="manager-message">{message}</p>}
        {error && <p className="manager-error">{error}</p>}
      </form>
    </section>
  );
}

export default SettingsManager;
