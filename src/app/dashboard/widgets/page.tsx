import { requireAdmin } from "@/lib/auth/require-admin";
import { saveHomeWidgets } from "./actions";

export const metadata = { title: "Home widgets" };
export const dynamic = "force-dynamic";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export default async function HomeWidgetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ supabase }, query] = await Promise.all([requireAdmin(), searchParams]);
  const { data } = await supabase.from("widgets")
    .select("widget_type,settings,is_visible")
    .in("widget_type", ["map", "datetime"]);
  const map = data?.find((item) => item.widget_type === "map");
  const clock = data?.find((item) => item.widget_type === "datetime");
  const settings = asRecord(map?.settings);
  const notice = query.saved ? "Widget settings saved." :
    query.error === "coordinates" ? "Enter a Google Maps share link or both coordinates before showing the map." :
    query.error === "map_url" ? "Enter a valid HTTPS Google Maps share link." :
    query.error ? "The settings could not be saved. Verify the map settings and try again." : "";

  return (
    <section>
      <p className="eyebrow">Homepage configuration</p>
      <h1>Home widgets</h1>
      <p className="lead">Choose whether the Bangladesh clock and village map appear on the homepage. Widget titles are not shown to visitors.</p>
      {notice && <p role={query.error ? "alert" : "status"} className={query.error ? "form-error" : "form-success"}>{notice}</p>}
      <article className="card">
        <form className="form wide-form" action={saveHomeWidgets}>
          <label className="inline-checkbox">
            <input type="checkbox" name="clockVisible" defaultChecked={clock?.is_visible ?? true} />
            Show Bangladesh date and time
          </label>
          <label className="inline-checkbox">
            <input type="checkbox" name="mapVisible" defaultChecked={map?.is_visible ?? true} />
            Show village map
          </label>
          <label>Latitude
            <input name="latitude" inputMode="decimal" defaultValue={settings.latitude == null ? "" : String(settings.latitude)} placeholder="e.g. 23.8103" />
          </label>
          <label>Longitude
            <input name="longitude" inputMode="decimal" defaultValue={settings.longitude == null ? "" : String(settings.longitude)} placeholder="e.g. 90.4125" />
          </label>
          <label>Default map zoom (1–20)
            <input name="zoom" type="number" min={1} max={20} step={1} defaultValue={typeof settings.zoom === "number" ? settings.zoom : 12} required />
          </label>
          <p className="muted-note">Use a Google Maps share link or enter both coordinates. The map opens externally only when a visitor clicks it.</p>
          <button className="button" type="submit">Save widget settings</button>
        </form>
      </article>
    </section>
  );
}
