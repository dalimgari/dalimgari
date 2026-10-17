import { requireAdmin } from "@/lib/auth/require-admin";
import { restorePage } from "../pages/actions";

export const metadata = { title: "Recycle Bin" };
export const dynamic = "force-dynamic";

function stringField(value: unknown, key: string) {
  if (!value || typeof value !== "object" || !(key in value)) return "";
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "string" ? field : "";
}

export default async function RecycleBinPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ supabase }, query] = await Promise.all([requireAdmin(), searchParams]);
  const { data, error } = await supabase
    .from("recycle_bin")
    .select("id,record_data,deleted_at,purge_after")
    .eq("original_table", "pages")
    .order("deleted_at", { ascending: false })
    .limit(200);

  return (
    <section>
      <p className="eyebrow">Recovery</p>
      <h1>Recycle Bin</h1>
      <p className="lead">Deleted pages can be restored within 30 days. Expired items are removed by the database cleanup job.</p>
      {query.restored && <p role="status" className="form-success">Page restored.</p>}
      {query.error && <p role="alert" className="form-error">The operation could not be completed.</p>}
      {error && <p role="alert" className="form-error">Recycle Bin could not be loaded.</p>}
      {!error && (!data || data.length === 0) && <article className="card"><p>The Recycle Bin is empty.</p></article>}
      <div className="section-grid">
        {(data ?? []).map((item) => (
          <article className="card" key={item.id}>
            <h2>{stringField(item.record_data, "title_en") || stringField(item.record_data, "title") || "Untitled page"}</h2>
            <p className="muted-note">Deleted: {new Date(item.deleted_at).toLocaleString("en-GB", { timeZone: "UTC" })} UTC</p>
            <p className="muted-note">Purge after: {new Date(item.purge_after).toLocaleString("en-GB", { timeZone: "UTC" })} UTC</p>
            <form action={restorePage}>
              <input type="hidden" name="id" value={item.id} />
              <button className="button" type="submit">Restore page</button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
