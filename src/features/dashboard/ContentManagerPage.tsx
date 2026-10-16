import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import type { TablesInsert, TablesUpdate } from "../../types/database.types";
import { supabase } from "../../services/supabase";
import { sanitizeHtml } from "../../utils/sanitizeHtml";

type ManagedTable = "hero_items" | "post" | "pages" | "albums" | "widgets";
type Row = Record<string, unknown>;

const config: Record<
  string,
  {
    table: ManagedTable;
    title: string;
    hasDescription: boolean;
    hasContent: boolean;
    hasUrl: boolean;
    hasWidgetType: boolean;
  }
> = {
  hero: {
    table: "hero_items",
    title: "Hero",
    hasDescription: true,
    hasContent: false,
    hasUrl: true,
    hasWidgetType: false,
  },
  post: {
    table: "post",
    title: "Post",
    hasDescription: true,
    hasContent: true,
    hasUrl: true,
    hasWidgetType: false,
  },
  page: {
    table: "pages",
    title: "Page",
    hasDescription: true,
    hasContent: true,
    hasUrl: true,
    hasWidgetType: false,
  },
  album: {
    table: "albums",
    title: "Album",
    hasDescription: true,
    hasContent: false,
    hasUrl: true,
    hasWidgetType: false,
  },
  widget: {
    table: "widgets",
    title: "Widget",
    hasDescription: false,
    hasContent: false,
    hasUrl: false,
    hasWidgetType: true,
  },
};

function htmlToPlainText(value: string): string {
  const document = new DOMParser().parseFromString(value, "text/html");
  document.querySelectorAll("script, style").forEach((element) => element.remove());
  return document.body.textContent ?? "";
}

function plainTextToSafeHtml(value: string): string {
  const escape = (text: string) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  return value
    .split(/\n{2,}/)
    .map((paragraph) => "<p>" + escape(paragraph).replace(/\n/g, "<br>") + "</p>")
    .join("");
}

async function listRows(table: ManagedTable): Promise<Row[]> {
  if (!supabase) throw new Error("Supabase configuration is missing.");
  switch (table) {
    case "hero_items": {
      const { data, error } = await supabase
        .from("hero_items")
        .select("id,title,description,url,visibility,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    }
    case "post": {
      const { data, error } = await supabase
        .from("post")
        .select("id,title,description,content,url,visibility,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    }
    case "pages": {
      const { data, error } = await supabase
        .from("pages")
        .select("id,title,description,content,url,visibility,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    }
    case "albums": {
      const { data, error } = await supabase
        .from("albums")
        .select("id,title,description,url,visibility,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    }
    case "widgets": {
      const { data, error } = await supabase
        .from("widgets")
        .select("id,title,widget_type,is_visible,settings,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    }
  }
}

async function saveRow(table: ManagedTable, payload: Row, id: string | null): Promise<void> {
  if (!supabase) throw new Error("Supabase configuration is missing.");
  switch (table) {
    case "hero_items": {
      const result = id
        ? await supabase
            .from("hero_items")
            .update(payload as TablesUpdate<"hero_items">)
            .eq("id", id)
        : await supabase.from("hero_items").insert(payload as TablesInsert<"hero_items">);
      if (result.error) throw result.error;
      return;
    }
    case "post": {
      const result = id
        ? await supabase
            .from("post")
            .update(payload as TablesUpdate<"post">)
            .eq("id", id)
        : await supabase.from("post").insert(payload as TablesInsert<"post">);
      if (result.error) throw result.error;
      return;
    }
    case "pages": {
      const result = id
        ? await supabase
            .from("pages")
            .update(payload as TablesUpdate<"pages">)
            .eq("id", id)
        : await supabase.from("pages").insert(payload as TablesInsert<"pages">);
      if (result.error) throw result.error;
      return;
    }
    case "albums": {
      const result = id
        ? await supabase
            .from("albums")
            .update(payload as TablesUpdate<"albums">)
            .eq("id", id)
        : await supabase.from("albums").insert(payload as TablesInsert<"albums">);
      if (result.error) throw result.error;
      return;
    }
    case "widgets": {
      const result = id
        ? await supabase
            .from("widgets")
            .update(payload as TablesUpdate<"widgets">)
            .eq("id", id)
        : await supabase.from("widgets").insert(payload as TablesInsert<"widgets">);
      if (result.error) throw result.error;
      return;
    }
  }
}

export function ContentManagerPage() {
  const { section = "" } = useParams();
  const settings = config[section];
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [widgetType, setWidgetType] = useState("datetime");
  const [widgetSettings, setWidgetSettings] = useState("{}");
  const [widgetVisible, setWidgetVisible] = useState(true);

  const load = useCallback(async () => {
    if (!settings) return;
    const data = await listRows(settings.table);
    setRows(data);
  }, [settings]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        if (!supabase) throw new Error("Supabase configuration is missing.");
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data.user) throw new Error("Log in to access this section.");
        const admin = String(data.user.app_metadata?.role ?? "").toLowerCase() === "admin";
        let granted: string[] = [];
        if (!admin || settings.table === "widgets") {
          const { data: values, error: permissionError } = await supabase.rpc("get_my_permissions");
          if (permissionError) throw new Error("Could not verify permissions.");
          if (Array.isArray(values))
            granted = values.filter((value): value is string => typeof value === "string");
        }
        const canAccessSection =
          settings.table === "widgets"
            ? granted.includes("settings.manage")
            : settings.table === "pages"
              ? admin ||
                ["content.view", "content.create", "content.edit"].some((value) =>
                  granted.includes(value),
                )
              : ["content.view", "content.create", "content.edit"].some((value) =>
                  granted.includes(value),
                );
        if (!canAccessSection) {
          throw new Error("You do not have permission to access this section.");
        }
        if (!active) return;
        setIsAdmin(admin);
        setPermissions(granted);
        await load();
      } catch (loadError) {
        if (active)
          setError(loadError instanceof Error ? loadError.message : "Data could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void init();
    return () => {
      active = false;
    };
  }, [load]);

  const canCreate =
    settings?.table === "widgets"
      ? permissions.includes("settings.manage")
      : settings?.table === "pages"
        ? isAdmin || permissions.includes("content.create")
        : permissions.includes("content.create");
  const canEdit =
    settings?.table === "widgets"
      ? permissions.includes("settings.manage")
      : settings?.table === "pages"
        ? isAdmin || permissions.includes("content.edit")
        : permissions.includes("content.edit");

  const startEdit = (row: Row) => {
    setEditingId(String(row.id));
    setTitle(String(row.title ?? ""));
    setDescription(String(row.description ?? ""));
    setBody(
      settings.table === "pages"
        ? sanitizeHtml(String(row.content ?? ""))
        : htmlToPlainText(String(row.content ?? "")),
    );
    setUrl(String(row.url ?? ""));
    setVisibility(String(row.visibility ?? "private"));
    setWidgetType(String(row.widget_type ?? "datetime"));
    setWidgetSettings(JSON.stringify(row.settings ?? {}, null, 2));
    setWidgetVisible(row.is_visible !== false);
    setError("");
    setNotice("");
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setBody("");
    setUrl("");
    setVisibility("private");
    setWidgetType("datetime");
    setWidgetSettings("{}");
    setWidgetVisible(true);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings) return;
    setError("");
    setNotice("");
    if (editingId && !canEdit) {
      setError("You do not have edit permission.");
      return;
    }
    if (!editingId && !canCreate) {
      setError("You do not have create permission.");
      return;
    }
    const payload: Row = { title: title.trim() };
    if (settings.hasDescription) payload.description = description.trim() || null;
    if (settings.hasContent)
      payload.content = settings.table === "pages" ? sanitizeHtml(body) : plainTextToSafeHtml(body);
    if (settings.hasUrl) {
      const normalizedUrl = url.trim().replace(/^\/+|\/+$/g, "");
      if (!normalizedUrl) {
        setError("Enter a URL/slug.");
        return;
      }
      payload.url = normalizedUrl;
    }
    if (settings.table !== "widgets") payload.visibility = visibility;
    if (settings.hasWidgetType) {
      let parsedSettings: unknown;
      try {
        parsedSettings = JSON.parse(widgetSettings);
      } catch {
        setError("Widget settings must be valid JSON.");
        return;
      }
      if (!parsedSettings || typeof parsedSettings !== "object" || Array.isArray(parsedSettings)) {
        setError("Widget settings must be a JSON object.");
        return;
      }
      payload.widget_type = widgetType;
      payload.settings = parsedSettings;
      payload.is_visible = widgetVisible;
    }

    setSaving(true);
    try {
      await saveRow(settings.table, payload, editingId);
      await load();
      setNotice(editingId ? "Changes saved." : "New record created.");
      resetForm();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save. Check the database RLS policy.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!settings)
    return (
      <section className="notice-card">
        <h1>Section not found</h1>
        <Link to="/dashboard">Return to dashboard</Link>
      </section>
    );
  if (loading) return <p role="status">Checking permissions and loading data…</p>;

  return (
    <section className="content-manager" aria-labelledby="manager-title">
      <p>
        <Link to="/dashboard">← Dashboard</Link>
      </p>
      <h1 id="manager-title">Manage {settings.title}</h1>
      {error ? <p role="alert">{error}</p> : null}
      {notice ? <p role="status">{notice}</p> : null}
      {canCreate || (editingId && canEdit) ? (
        <form className="content-manager-form" onSubmit={(event) => void submit(event)}>
          <h2>{editingId ? "Edit record" : "New record"}</h2>
          <label htmlFor="managed-title">Title</label>
          <input
            id="managed-title"
            required
            maxLength={180}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          {settings.hasUrl ? (
            <>
              <label htmlFor="managed-url">URL / slug</label>
              <input
                id="managed-url"
                required
                maxLength={180}
                pattern="[A-Za-z0-9/_-]+"
                title="English letters, numbers, slash, hyphen, and underscore only"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
            </>
          ) : null}
          {settings.hasDescription ? (
            <>
              <label htmlFor="managed-description">Description</label>
              <textarea
                id="managed-description"
                rows={3}
                maxLength={3000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </>
          ) : null}
          {settings.hasContent ? (
            <>
              <label htmlFor="managed-content">
                {settings.table === "pages" ? "HTML Code" : "Content (plain text)"}
              </label>
              <textarea
                id="managed-content"
                rows={settings.table === "pages" ? 16 : 8}
                maxLength={50000}
                spellCheck={settings.table !== "pages"}
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
              <p>
                {settings.table === "pages"
                  ? "Safe HTML elements are supported. Scripts, embedded documents, event handlers, and unsafe URLs are removed before display."
                  : "Post content is stored as plain text and displayed without executing HTML."}
              </p>
            </>
          ) : null}
          {settings.table === "widgets" ? (
            <>
              <label htmlFor="managed-widget-type">Widget type</label>
              <select
                id="managed-widget-type"
                value={widgetType}
                onChange={(event) => setWidgetType(event.target.value)}
              >
                <option value="datetime">datetime</option>
                <option value="map">map</option>
              </select>
              <label htmlFor="managed-widget-settings">Settings JSON</label>
              <textarea
                id="managed-widget-settings"
                rows={5}
                value={widgetSettings}
                onChange={(event) => setWidgetSettings(event.target.value)}
              />
              <label>
                <input
                  type="checkbox"
                  checked={widgetVisible}
                  onChange={(event) => setWidgetVisible(event.target.checked)}
                />{" "}
                Show on homepage
              </label>
            </>
          ) : (
            <>
              <label htmlFor="managed-visibility">Visibility</label>
              <select
                id="managed-visibility"
                value={visibility}
                onChange={(event) => setVisibility(event.target.value)}
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </>
          )}
          <div className="profile-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Create"}
            </button>
            {editingId ? (
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <p>You do not have create/edit permission.</p>
      )}

      <section aria-labelledby="managed-records-title">
        <h2 id="managed-records-title">Records ({rows.length})</h2>
        {rows.length === 0 ? <p>No records found.</p> : null}
        <div className="managed-record-list">
          {rows.map((row) => (
            <article className="managed-record" key={String(row.id)}>
              <div>
                <h3>{String(row.title ?? "Untitled")}</h3>
                {typeof row.description === "string" && row.description ? (
                  <p>{row.description}</p>
                ) : null}
                {typeof row.url === "string" && row.url ? (
                  <p>
                    <code>{row.url}</code>
                  </p>
                ) : null}
                <small>
                  {String(row.visibility ?? (row.is_visible === true ? "visible" : "hidden"))}
                </small>
              </div>
              {canEdit ? (
                <button type="button" onClick={() => startEdit(row)}>
                  Edit
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
