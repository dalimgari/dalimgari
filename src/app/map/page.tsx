import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeGoogleMapsShareUrl } from "@/lib/google-maps-url";

export const metadata = { title: "Village map" };
export const dynamic = "force-dynamic";

export default async function MapPage() {
  let settings: Record<string, unknown> = {};
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("widgets")
      .select("settings")
      .eq("widget_type", "map")
      .eq("is_visible", true)
      .limit(1)
      .maybeSingle();
    if (data?.settings && typeof data.settings === "object" && !Array.isArray(data.settings)) {
      settings = data.settings as Record<string, unknown>;
    }
  } catch {
    // The map remains usable as a configuration placeholder until Supabase is configured.
  }

  const latitude = Number(settings.latitude ?? settings.lat);
  const longitude = Number(settings.longitude ?? settings.lng);
  const validCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90
    && longitude >= -180 && longitude <= 180;
  const mapUrl = typeof settings.mapUrl === "string" ? normalizeGoogleMapsShareUrl(settings.mapUrl) : null;
  const rawZoom = Number(settings.zoom);
  const zoom = Number.isInteger(rawZoom) && rawZoom >= 1 && rawZoom <= 20 ? rawZoom : 12;
  const destination = mapUrl ?? (validCoordinates
    ? `https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom}`
    : null);

  return (
    <section className="card">
      <p className="eyebrow">Community location</p>
      <h1>Village map</h1>
      {destination ? (
        <>
          <p className="lead">Open the saved location in Google Maps. The map is not embedded, so no third-party map request is made until you choose to open it.</p>
          <a className="button" href={destination} target="_blank" rel="noopener noreferrer">Open map</a>
        </>
      ) : (
        <p className="lead">The map location has not been configured by an administrator yet.</p>
      )}
    </section>
  );
}
