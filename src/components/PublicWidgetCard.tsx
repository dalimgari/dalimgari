import { useEffect, useState } from "react";
import type { PublicWidget } from "../services/content";

function getDhakaDateTime(): string {
  return new Intl.DateTimeFormat("bn-BD", {
    dateStyle: "full",
    timeStyle: "medium",
    timeZone: "Asia/Dhaka",
  }).format(new Date());
}

export function PublicWidgetCard({ widget }: { widget: PublicWidget }) {
  const [dateTime, setDateTime] = useState(getDhakaDateTime);

  useEffect(() => {
    if (widget.widget_type !== "datetime") return;
    const timer = window.setInterval(() => setDateTime(getDhakaDateTime()), 1000);
    return () => window.clearInterval(timer);
  }, [widget.widget_type]);

  if (widget.widget_type === "datetime") {
    return (
      <article className="home-content-card">
        <h3>{widget.title || "বাংলাদেশ সময়"}</h3>
        <p className="widget-datetime">{dateTime}</p>
      </article>
    );
  }

  if (widget.widget_type === "map") {
    const location = typeof widget.settings.location === "string" ? widget.settings.location.trim() : "Saudi Arabia";
    const configuredZoom = Number(widget.settings.zoom);
    const zoom = Number.isFinite(configuredZoom) ? Math.max(1, Math.min(21, Math.round(configuredZoom))) : 13;
    const fallbackUrl = "https://maps.google.com/maps?q=" + encodeURIComponent(location) + "&z=" + zoom + "&output=embed";
    let mapUrl = fallbackUrl;
    if (typeof widget.settings.embed_url === "string") {
      try {
        const candidate = new URL(widget.settings.embed_url);
        if (candidate.protocol === "https:" && ["maps.google.com", "www.google.com", "openstreetmap.org", "www.openstreetmap.org"].includes(candidate.hostname)) {
          mapUrl = candidate.toString();
        }
      } catch {
        // Use the safe generated map URL when the configured embed URL is invalid.
      }
    }
    return (
      <article className="home-content-card">
        <h3>{widget.title || "মানচিত্র"}</h3>
        <iframe title={widget.title || "মানচিত্র"} src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      </article>
    );
  }

  return (
    <article className="home-content-card">
      <h3>{widget.title || "কমিউনিটি উইজেট"}</h3>
    </article>
  );
}
