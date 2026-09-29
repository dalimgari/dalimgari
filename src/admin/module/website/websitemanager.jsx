import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import MediaInput from "../components/MediaInput";

function WebsiteManager({ onBack }) {
  const [website, setWebsite] = useState(null);
  const [websiteName, setWebsiteName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [slogan, setSlogan] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerStyle, setBannerStyle] = useState("classic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadWebsite() {
    setLoading(true);

    const { data, error } = await supabase
      .from("WebsiteInformation")
      .select(
        "id, website_name, logo_url, slogan, banner_url, banner_style, created_at, updated_at"
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      setMessage(error.message);
    } else if (data) {
      setWebsite(data);
      setWebsiteName(data.website_name || "");
      setLogoUrl(data.logo_url || "");
      setSlogan(data.slogan || "");
      setBannerUrl(data.banner_url || "");
      setBannerStyle(data.banner_style || "classic");
      setMessage("");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadWebsite();
  }, []);

  async function saveWebsite(event) {
    event.preventDefault();

    if (!websiteName.trim()) {
      setMessage("Website name is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      website_name: websiteName.trim(),
      logo_url: logoUrl.trim() || null,
      slogan: slogan.trim() || null,
      banner_url: bannerUrl.trim() || null,
      banner_style: bannerStyle.trim() || "classic",
      updated_at: new Date().toISOString()
    };

    let result;

    if (website?.id) {
      result = await supabase
        .from("WebsiteInformation")
        .update(payload)
        .eq("id", website.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("WebsiteInformation")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      setMessage(result.error.message);
    } else {
      setWebsite(result.data);
      setMessage("Website information saved successfully.");
    }

    setSaving(false);
  }

  return (
    <section>
      <div>
        <button type="button" onClick={onBack}>
          Back
        </button>

        <h2>Website Information</h2>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={saveWebsite}>
          <input
            type="text"
            value={websiteName}
            onChange={(event) => setWebsiteName(event.target.value)}
            placeholder="Website Name"
            required
          />

          <MediaInput
            value={logoUrl}
            onChange={setLogoUrl}
            accept="image/*"
          />

          <input
            type="text"
            value={slogan}
            onChange={(event) => setSlogan(event.target.value)}
            placeholder="Slogan"
          />

          <MediaInput
            value={bannerUrl}
            onChange={setBannerUrl}
            accept="image/*"
          />

          <select
            value={bannerStyle}
            onChange={(event) => setBannerStyle(event.target.value)}
          >
            <option value="classic">Classic</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="minimal">Minimal</option>
          </select>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Website Information"}
          </button>
        </form>
      )}

      {message && <p>{message}</p>}

      {bannerUrl && (
        <div>
          <h3>Banner Preview</h3>
          <img
            src={bannerUrl}
            alt="Website banner"
            style={{
              width: "100%",
              maxWidth: "900px",
              display: "block"
            }}
          />
        </div>
      )}
    </section>
  );
}

export default WebsiteManager;
