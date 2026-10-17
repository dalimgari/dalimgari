import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const valid = Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90
    && longitude >= -180 && longitude <= 180;

  return (
    <section className="card">
      <p className="eyebrow">Community location</p>
      <h1>Village map</h1>
      {valid ? (
        <>
          <p className="lead">Open the saved location in your map service. The map is not embedded, so no third-party map request is made until you choose to open it.</p>
          <a className="button" href={`https://www.google.com/maps?q=${latitude},${longitude}&z=${Number(settings.zoom) || 12}`} target="_blank" rel="noopener noreferrer">Open map</a>
        </>
      ) : (
        <p className="lead">The map location has not been configured by an administrator yet.</p>
      )}
    </section>
  );
}
