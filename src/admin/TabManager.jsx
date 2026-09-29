import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function TabManager({ onBack }) {
  const [tabs, setTabs] = useState([]);
  const [pages, setPages] = useState([]);
  const [pageId, setPageId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [tabsResult, pagesResult] = await Promise.all([
      supabase
        .from("site_tabs")
        .select(`
          id,
          tab_key,
          page_id,
          sort_order,
          enabled,
          pages (
            id,
            slug,
            title,
            title_bn,
            title_en,
            content_type,
            published
          )
        `)
        .order("sort_order", { ascending: true }),

      supabase
        .from("pages")
        .select("id, slug, title, title_bn, title_en, content_type, published")
        .eq("published", true)
        .order("created_at", { ascending: true })
    ]);

    if (tabsResult.error) {
      setMessage(tabsResult.error.message);
    } else {
      setTabs(tabsResult.data || []);
    }

    if (pagesResult.error) {
      setMessage(pagesResult.error.message);
    } else {
      setPages(pagesResult.data || []);
    }

    setLoading(false);
  }

  function resetForm() {
    setPageId("");
    setEditingId(null);
    setEnabled(true);
    setMessage("");
  }

  function editTab(tab) {
    setEditingId(tab.id);
    setPageId(tab.page_id || "");
    setEnabled(tab.enabled !== false);
    setMessage("");
  }

  function getNextTabNumber() {
    const numbers = tabs
      .map((tab) => {
        const match = String(tab.tab_key || "").match(
          /^tab(\d+)$/
        );

        return match ? Number(match[1]) : 0;
      })
      .filter(Boolean);

    return numbers.length > 0
      ? Math.max(...numbers) + 1
      : 1;
  }

  async function saveTab(event) {
    event.preventDefault();

    if (!pageId) {
      setMessage("Select a page.");
      return;
    }

    setSaving(true);
    setMessage("");

    const duplicate = tabs.find(
      (tab) =>
        tab.page_id === pageId &&
        tab.id !== editingId
    );

    if (duplicate) {
      setMessage(
        "This page is already assigned to a home tab."
      );
      setSaving(false);
      return;
    }

    let error;

    if (editingId) {
      const result = await supabase
        .from("site_tabs")
        .update({
          page_id: pageId,
          enabled,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingId);

      error = result.error;
    } else {
      const nextNumber = getNextTabNumber();

      const result = await supabase
        .from("site_tabs")
        .insert({
          tab_key: `tab${nextNumber}`,
          page_id: pageId,
          sort_order: tabs.length + 1,
          enabled
        });

      error = result.error;
    }

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    resetForm();
    setMessage("Home tab saved successfully.");
    await loadData();

    setSaving(false);
  }

  async function deleteTab(id) {
    if (!window.confirm("Delete this home tab?")) {
      return;
    }

    const { error } = await supabase
      .from("site_tabs")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Home tab deleted successfully.");
    await loadData();
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

    await loadData();
  }

  async function moveTab(index, direction) {
    const targetIndex = index + direction;

    if (
      targetIndex < 0 ||
      targetIndex >= tabs.length
    ) {
      return;
    }

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

    await loadData();
  }

  const assignedPageIds = tabs
    .filter((tab) => tab.id !== editingId)
    .map((tab) => tab.page_id);

  const availablePages = pages.filter(
    (page) =>
      page.published !== false &&
      !assignedPageIds.includes(page.id)
  );

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">
            Administration
          </p>
          <h1>Home Tabs</h1>
        </div>

        <button type="button" onClick={onBack}>
          Dashboard
        </button>
      </header>

      <section className="admin-content">
        <div className="admin-welcome">
          <h2>Homepage Tabs</h2>
          <p>
            Create a tab by selecting an existing page.
          </p>
        </div>

        <form
          className="admin-form"
          onSubmit={saveTab}
        >
          <label>
            Page
            <select
              value={pageId}
              onChange={(event) =>
                setPageId(event.target.value)
              }
            >
              <option value="">
                Select a page
              </option>

              {availablePages.map((page) => (
                <option
                  key={page.id}
                  value={page.id}
                >
                  {page.title_bn || page.title_en || page.title} /{page.slug}
                </option>
              ))}
            </select>
          </label>

          <label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) =>
                setEnabled(event.target.checked)
              }
            />
            Show on homepage
          </label>

          <div className="admin-header-actions">
            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Tab"
                  : "Create Tab"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {message && <p>{message}</p>}

        <div className="admin-module-grid">
          {loading ? (
            <p>Loading...</p>
          ) : tabs.length === 0 ? (
            <p>No homepage tabs found.</p>
          ) : (
            tabs.map((tab, index) => (
              <div
                className="admin-module"
                key={tab.id}
              >
                <strong>
                  {tab.tab_key}
                </strong>

                <span>
                  {tab.pages?.title_bn || tab.pages?.title_en || tab.pages?.title || ""}
                  {" · "}
                  /{tab.pages?.slug || ""}
                  {" · "}
                  {tab.enabled
                    ? "Enabled"
                    : "Disabled"}
                </span>

                <div className="admin-header-actions">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() =>
                      moveTab(index, -1)
                    }
                  >
                    Up
                  </button>

                  <button
                    type="button"
                    disabled={
                      index === tabs.length - 1
                    }
                    onClick={() =>
                      moveTab(index, 1)
                    }
                  >
                    Down
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      toggleTab(tab)
                    }
                  >
                    {tab.enabled
                      ? "Hide"
                      : "Show"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      editTab(tab)
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteTab(tab.id)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
