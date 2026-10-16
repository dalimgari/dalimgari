import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Json } from "../../types/database.types";
import { supabase } from "../../services/supabase";

type AllowedTable = "post" | "pages" | "hero_items" | "albums" | "roles" | "permissions" | "site_customizations" | "site_settings";
interface TrashItem {
  id: string; original_id: string; original_table: AllowedTable; record_data: Json;
  related_data: Json; deleted_at: string; purge_after: string;
}
type Row = Record<string, unknown>;
const allowedTables = new Set<AllowedTable>(["post", "pages", "hero_items", "albums", "roles", "permissions", "site_customizations", "site_settings"]);
function asRecord(value: Json): Row {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
}
function titleFor(item: TrashItem): string {
  const record = asRecord(item.record_data);
  for (const key of ["title", "name", "caption", "full_name", "key"]) {
    if (typeof record[key] === "string" && record[key]) return record[key] as string;
  }
  return item.original_id;
}

export function RecycleBinPage() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!supabase) throw new Error("Supabase configuration is missing.");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Log in to access the Recycle Bin.");
    if (String(userData.user.app_metadata?.role ?? "").toLowerCase() !== "admin") {
      throw new Error("Only an administrator can manage the Recycle Bin.");
    }
    setIsAdmin(true);
    const { data, error: queryError } = await supabase.from("recycle_bin")
      .select("id,original_id,original_table,record_data,related_data,deleted_at,purge_after")
      .order("deleted_at", { ascending: false }).limit(500);
    if (queryError) throw queryError;
    setItems((data ?? []) as unknown as TrashItem[]);
  }, []);

  useEffect(() => {
    let active = true;
    void load().catch((e: unknown) => {
      if (active) setError(e instanceof Error ? e.message : "Could not load the Recycle Bin.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);

  const restore = async (item: TrashItem) => {
    if (!supabase || !isAdmin || !allowedTables.has(item.original_table)) return;
    if (!window.confirm("Restore this item to its original section?")) return;
    setBusyId(item.id); setError(""); setNotice("");
    try {
      const record = asRecord(item.record_data);
      const { error: insertError } = await supabase.from(item.original_table).insert(record as never);
      if (insertError) throw insertError;
      const related = item.related_data && typeof item.related_data === "object" && !Array.isArray(item.related_data)
        ? item.related_data as Record<string, Json> : {};
      const restoreLinks = async (table: "user_roles" | "role_permissions", rows: Json | undefined) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        const conflict = table === "user_roles" ? "user_id" : "role_id,permission_id";
        const { error: linkError } = await supabase.from(table).upsert(rows as never, { onConflict: conflict, ignoreDuplicates: true });
        if (linkError) throw linkError;
      };
      if (item.original_table === "roles") {
        await restoreLinks("user_roles", related.user_roles);
        await restoreLinks("role_permissions", related.role_permissions);
      } else if (item.original_table === "permissions") {
        await restoreLinks("role_permissions", related.role_permissions);
      }
      const { error: trashError } = await supabase.from("recycle_bin").delete().eq("id", item.id);
      if (trashError) throw trashError;
      await load();
      setNotice("Item restored successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not restore this item.");
    } finally { setBusyId(""); }
  };

  const permanentlyDelete = async (item: TrashItem) => {
    if (!supabase || !isAdmin) return;
    if (!window.confirm("Permanently delete this Recycle Bin record? This cannot be undone.")) return;
    setBusyId(item.id); setError(""); setNotice("");
    try {
      const { error: deleteError } = await supabase.from("recycle_bin").delete().eq("id", item.id);
      if (deleteError) throw deleteError;
      setItems(current => current.filter(entry => entry.id !== item.id));
      setNotice("Recycle Bin record permanently deleted. Stored files are retained because safe removal of shared files has not been verified.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not permanently delete this item.");
    } finally { setBusyId(""); }
  };

  if (loading) return <p role="status">Checking permissions and loading deleted items…</p>;
  if (error && !isAdmin) return <section className="notice-card"><h1>Recycle Bin</h1><p role="alert">{error}</p><Link to="/dashboard">Return to dashboard</Link></section>;

  return <section className="content-manager" aria-labelledby="recycle-bin-title">
    <p><Link to="/dashboard">← Dashboard</Link></p>
    <h1 id="recycle-bin-title">Recycle Bin</h1>
    <p>Deleted records are retained for 30 days before scheduled cleanup.</p>
    {error ? <p role="alert">{error}</p> : null}
    {notice ? <p role="status">{notice}</p> : null}
    {items.length === 0 ? <p>No deleted records found.</p> : <div className="managed-record-list">
      {items.map(item => <article className="managed-record" key={item.id}>
        <div><h2>{titleFor(item)}</h2>
          <p>Original section: <code>{item.original_table}</code></p>
          <p>Deleted: {new Date(item.deleted_at).toLocaleString()}</p>
          <p>Scheduled cleanup: {new Date(item.purge_after).toLocaleString()}</p>
        </div>
        <div className="profile-actions">
          <button type="button" disabled={busyId === item.id} onClick={() => void restore(item)}>Restore</button>
          <button type="button" disabled={busyId === item.id} onClick={() => void permanentlyDelete(item)}>Delete permanently</button>
        </div>
      </article>)}
    </div>}
  </section>;
}
