import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseclient";

function TabManager({ onBack }) {
  const [tabs, setTabs] = useState([]);
  const [pages, setPages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [tabKey, setTabKey] = useState("");
  const [pageId, setPageId] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);

    const [tabsResult, pagesResult] = await Promise.all([
      supabase
        .from("TabManagement")
        .select("id, tab_key, page_id, sort_order, enabled, created_at, updated_at")
        .order("sort_order", { ascending: true }),

      supabase
        .from("PageManagement")
        .select("id, slug, title, published")
        .order("title", { ascending: true })
    ]);

    if (tabsResult.error) {
      setMessage(tabsResult.error.message);
    } else if (pagesResult.error) {
      setMessage(pagesResult.error.message);
    } else {
      setTabs(tabsResult.data || []);
      setPages(pagesResult.data || []);
      setMessage("");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setEditingId(null);
    setTabKey("");
    setPageId("");
    setSortOrder(0);
    setEnabled(true);
  }

  function editTab(item) {
    setEditingId(item.id);
    setTabKey(item.tab_key || "");
    setPageId(item.page_id || "");
    setSortOrder(item.sort_order ?? 0);
    setEnabled(item.enabled ?? true);
    setMessage("");
  }

  async function saveTab(event) {
    event.preventDefault();

    if (!tabKey.trim()) {
      setMessage("Tab key is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      tab_key: tabKey.trim(),
      page_id: pageId || null,
      sort_order: Number(sortOrder) || 0,
      enabled,
      updated_at: new Date().toISOString()
    };

    let error;

    if (editingId) {
      ({ error } = await supabase
        .from("TabManagement")
        .update(payload)
        .eq("id", editingId));
    } else {
      ({ error } = await supabase
        .from("TabManagement")
        .insert(payload));
    }

    if (error) {
      setMessage(error.message);
    } else {
      resetForm();
      await loadData();
      setMessage("Tab saved successfully.");
    }

    setSaving(false);
  }

  async function deleteTab(item) {
    if (!window.confirm(`Delete "${item.tab_key}"?`)) {
      return;
    }

    const { error } = await supabase
      .from("TabManagement")
      .delete()
      .eq("id", item.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (editingId === item.id) {
      resetForm();
    }

    await loadData();
    setMessage("Tab deleted successfully.");
  }

  function getPageTitle(pageIdValue) {
    const page = pages.find((item) => item.id === pageIdValue);
    return page?.title || "No page";
  }

  return (
    <section>
      <div>
        <button type="button" onClick={onBack}>
          Back
        </button>

        <h2>Tab Management</h2>
      </div>

      <form onSubmit={saveTab}>
        <input
          type="text"
          value={tabKey}
          onChange={(event) => setTabKey(event.target.value)}
          placeholder="Tab Key"
          required
        />

        <select
          value={pageId}
          onChange={(event) => setPageId(event.target.value)}
        >
          <option value="">No Page</option>

          {pages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.title}
              {page.published === false ? " (Draft)" : ""}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          placeholder="Sort Order"
        />

        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          Enabled
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : editingId ? "Update Tab" : "Add Tab"}
        </button>

        {editingId && (
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        )}
      </form>

      {message && <p>{message}</p>}

      <div>
        {loading ? (
          <p>Loading...</p>
        ) : tabs.length === 0 ? (
          <p>No tabs found.</p>
        ) : (
          tabs.map((item) => (
            <article key={item.id}>
              <h3>{getPageTitle(item.page_id)}</h3>

              <p>
                Key: {item.tab_key}
                <br />
                Order: {item.sort_order}
                <br />
                Status: {item.enabled ? "Enabled" : "Disabled"}
              </p>

              <button type="button" onClick={() => editTab(item)}>
                Edit
              </button>

              <button
                type="button"
                className="delete-button"
                onClick={() => deleteTab(item)}
              >
                Delete
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default TabManager;
