import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { Json, Tables, TablesUpdate } from "../../types/database.types";
import { supabase } from "../../services/supabase";

type SettingRow = Tables<"site_customizations">;

export function SettingsManagerPage() {
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [valueText, setValueText] = useState("{}");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!supabase) throw new Error("Supabase configuration পাওয়া যায়নি।");
    const { data, error: queryError } = await supabase
      .from("site_customizations")
      .select("id,key,value,description,updated_at,created_at,updated_by")
      .order("key", { ascending: true })
      .limit(300);
    if (queryError) throw queryError;
    const settings = data ?? [];
    setRows(settings);
    setSelectedId((current) =>
      settings.some((row) => row.id === current) ? current : (settings[0]?.id ?? ""),
    );
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        if (!supabase) throw new Error("Supabase configuration পাওয়া যায়নি।");
        const { data: userData, error: authError } = await supabase.auth.getUser();
        if (authError || !userData.user) throw new Error("Settings পরিচালনা করতে লগইন করতে হবে।");
        const { data: permissions, error: permissionError } =
          await supabase.rpc("get_my_permissions");
        if (permissionError || !permissions.includes("settings.manage")) {
          throw new Error("এই বিভাগের জন্য settings.manage permission প্রয়োজন।");
        }
        await load();
      } catch (loadError) {
        if (active)
          setError(loadError instanceof Error ? loadError.message : "Settings লোড করা যায়নি।");
      } finally {
        if (active) setLoading(false);
      }
    };
    void init();
    return () => {
      active = false;
    };
  }, [load]);

  const selected = rows.find((row) => row.id === selectedId) ?? null;

  useEffect(() => {
    if (selected) setValueText(JSON.stringify(selected.value, null, 2));
  }, [selectedId, selected]);

  const selectSetting = (row: SettingRow) => {
    setSelectedId(row.id);
    setValueText(JSON.stringify(row.value, null, 2));
    setError("");
    setMessage("");
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !selected) return;
    setError("");
    setMessage("");
    let parsed: Json;
    try {
      parsed = JSON.parse(valueText) as Json;
    } catch {
      setError("Value অবশ্যই বৈধ JSON হতে হবে।");
      return;
    }
    setSaving(true);
    try {
      const payload: TablesUpdate<"site_customizations"> = { value: parsed };
      const { error: updateError } = await supabase
        .from("site_customizations")
        .update(payload)
        .eq("id", selected.id);
      if (updateError) throw updateError;
      setMessage("Setting সংরক্ষণ হয়েছে।");
      await load();
    } catch {
      setError("Setting সংরক্ষণ করা যায়নি। RLS policy ও JSON schema যাচাই করুন।");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p role="status">Settings permission যাচাই হচ্ছে…</p>;
  if (error && rows.length === 0)
    return (
      <section className="notice-card">
        <h1>Settings</h1>
        <p role="alert">{error}</p>
        <Link to="/dashboard">ড্যাশবোর্ডে ফিরুন</Link>
      </section>
    );

  return (
    <section className="settings-manager" aria-labelledby="settings-manager-title">
      <p>
        <Link to="/dashboard">← ড্যাশবোর্ড</Link>
      </p>
      <h1 id="settings-manager-title">Site Settings ও Customization</h1>
      <p>
        শুধু settings.manage permission-ধারী ব্যবহারকারী এই মানগুলো পরিবর্তন করতে পারবেন। JSON value
        সংরক্ষণের আগে যাচাই করা হয়।
      </p>
      {error ? <p role="alert">{error}</p> : null}
      {message ? <p role="status">{message}</p> : null}
      <div className="settings-manager-layout">
        <nav className="settings-key-list" aria-label="Settings key list">
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              aria-current={row.id === selectedId ? "true" : undefined}
              onClick={() => selectSetting(row)}
            >
              <strong>{row.key || "(key নেই)"}</strong>
              {row.description ? <small>{row.description}</small> : null}
            </button>
          ))}
        </nav>
        {selected ? (
          <form className="settings-value-form" onSubmit={(event) => void save(event)}>
            <h2>{selected.key || "Unnamed setting"}</h2>
            {selected.description ? <p>{selected.description}</p> : null}
            <label htmlFor="setting-json-value">JSON value</label>
            <textarea
              id="setting-json-value"
              rows={18}
              spellCheck={false}
              value={valueText}
              onChange={(event) => setValueText(event.target.value)}
            />
            <small>
              শেষ আপডেট:{" "}
              {selected.updated_at
                ? new Date(selected.updated_at).toLocaleString("bn-BD")
                : "অজানা"}
            </small>
            <button type="submit" disabled={saving}>
              {saving ? "সংরক্ষণ হচ্ছে…" : "Setting সংরক্ষণ"}
            </button>
          </form>
        ) : (
          <p>কোনো setting পাওয়া যায়নি।</p>
        )}
      </div>
    </section>
  );
}
