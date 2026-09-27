import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const CONTENT_TYPES = [
  "home",
  "info",
  "article",
  "gallery",
  "people",
  "video",
  "news",
  "events",
  "custom"
];

function HomeTabsManager({ onBack }) {
  const [tabs, setTabs] = useState([]);
  const [form, setForm] = useState({
    id: "",
    tab_key: "",
    title_bn: "",
    title_en: "",
    content_type: "custom",
    enabled: true
  });
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadTabs();
  }, []);

  async function loadTabs() {
    const { data, error } = await supabase
      .from("site_tabs")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    setTabs(data || []);
  }

  function resetForm() {
    setForm({
      id: "",
      tab_key: "",
      title_bn: "",
      title_en: "",
      content_type: "custom",
      enabled: true
    });
    setEditing(false);
  }

  function editTab(tab) {
    setForm({
      id: tab.id,
      tab_key: tab.tab_key,
      title_bn: tab.title_bn,
      title_en: tab.title_en,
      content_type: tab.content_type,
      enabled: tab.enabled
    });
    setEditing(true);
    setMessage("");
  }

  async function saveTab(event) {
    event.preventDefault();
    setMessage("");

    if (!form.tab_key || !form.title_bn || !form.title_en) {
      setMessage("Required fields are missing.");
      return;
    }

    const payload = {
      tab_key: form.tab_key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
      title_bn: form.title_bn.trim(),
      title_en: form.title_en.trim(),
      content_type: form.content_type,
      enabled: form.enabled,
      updated_at: new Date().toISOString()
    };

    let result;

    if (editing) {
      result = await supabase
        .from("site_tabs")
        .update(payload)
        .eq("id", form.id);
    } else {
      const nextOrder =
        tabs.length > 0
          ? Math.max(...tabs.map((tab) => tab.sort_order)) + 1
          : 1;

      result = await supabase
        .from("site_tabs")
        .insert({
          ...payload,
          sort_order: nextOrder
        });
    }

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    resetForm();
    setMessage("Tab saved successfully.");
    loadTabs();
  }

  async function deleteTab(id) {
    if (!window.confirm("Delete this tab?")) return;

    const { error } = await supabase
      .from("site_tabs")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Tab deleted successfully.");
    loadTabs();
  }

  async function toggleTab(tab) {
    const { error } = await supabase
      .from("site_tabs")
      .update({
        enabled: !tab.enabled,
        updated_at: new Date().toISOString()
      })
      .eq("id", tab.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    loadTabs();
  }

  async function moveTab(index, direction) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= tabs.length) return;

    const current = tabs[index];
    const target = tabs[targetIndex];

    const first = await supabase
      .from("site_tabs")
      .update({
        sort_order: target.sort_order,
        updated_at: new Date().toISOString()
      })
      .eq("id", current.id);

    if (first.error) {
      setMessage(first.error.message);
      return;
    }

    const second = await supabase
      .from("site_tabs")
      .update({
        sort_order: current.sort_order,
        updated_at: new Date().toISOString()
      })
      .eq("id", target.id);

    if (second.error) {
      setMessage(second.error.message);
      return;
    }

    loadTabs();
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">Administration</p>
          <h1>Home Tabs</h1>
        </div>

        <div className="admin-header-actions">
          <button type="button" onClick={onBack}>
            Dashboard
          </button>
        </div>
      </header>

      <section className="admin-content">
        <div className="admin-welcome">
          <h2>Homepage Navigation</h2>
          <p>Manage homepage tabs and their order.</p>
        </div>

        <form className="admin-form" onSubmit={saveTab}>
          <label>
            Tab Key
            <input
              value={form.tab_key}
              onChange={(event) =>
                setForm({ ...form, tab_key: event.target.value })
              }
              disabled={editing}
              placeholder="tab-key"
            />
          </label>

          <label>
            Bangla Title
            <input
              value={form.title_bn}
              onChange={(event) =>
                setForm({ ...form, title_bn: event.target.value })
              }
            />
          </label>

          <label>
            English Title
            <input
              value={form.title_en}
              onChange={(event) =>
                setForm({ ...form, title_en: event.target.value })
              }
            />
          </label>

          <label>
            Content Type
            <select
              value={form.content_type}
              onChange={(event) =>
                setForm({ ...form, content_type: event.target.value })
              }
            >
              {CONTENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) =>
                setForm({ ...form, enabled: event.target.checked })
              }
            />
            Enabled
          </label>

          <div className="admin-header-actions">
            <button type="submit">
              {editing ? "Update Tab" : "Add Tab"}
            </button>

            {editing && (
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {message && <p>{message}</p>}

        <div className="admin-module-grid">
          {tabs.map((tab, index) => (
            <div className="admin-module" key={tab.id}>
              <strong>
                {tab.title_bn} / {tab.title_en}
              </strong>

              <span>
                {tab.tab_key} · {tab.content_type} ·{" "}
                {tab.enabled ? "Enabled" : "Disabled"}
              </span>

              <div className="admin-header-actions">
                <button
                  type="button"
                  onClick={() => moveTab(index, -1)}
                  disabled={index === 0}
                >
                  Up
                </button>

                <button
                  type="button"
                  onClick={() => moveTab(index, 1)}
                  disabled={index === tabs.length - 1}
                >
                  Down
                </button>

                <button type="button" onClick={() => toggleTab(tab)}>
                  {tab.enabled ? "Disable" : "Enable"}
                </button>

                <button type="button" onClick={() => editTab(tab)}>
                  Edit
                </button>

                <button type="button" onClick={() => deleteTab(tab.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default HomeTabsManager;
