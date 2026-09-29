import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import MediaInput from "../components/MediaInput";

const CONTENT_TYPES = [
  "info",
  "article",
  "gallery",
  "people",
  "video",
  "news",
  "events",
  "custom"
];

export default function PageManager({ onBack }) {
  const [pages, setPages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    title: "",
    content: "",
    content: "",
    content_type: "custom",
    cover_media: "",
    published: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    setLoading(true);

    const { data, error } = await supabase
      .from("PageManagement")
      .select(
        "id, slug, title, title, title, content, content, content, content_type, cover_media, published, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setPages(data || []);
    }

    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      slug: "",
      title: "",
      title: "",
      content: "",
      content: "",
      content_type: "custom",
      cover_media: "",
      published: true
    });
    setMessage("");
  }

  function normalizeSlug(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function editPage(page) {
    setEditingId(page.id);

    setForm({
      slug: page.slug || "",
      title: page.title || "",
      title: page.title || "",
      content: page.content || "",
      content: page.content || "",
      content_type: page.content_type || "custom",
      cover_media: page.cover_media || "",
      published: page.published !== false
    });

    setMessage("");
  }

  async function savePage(event) {
    event.preventDefault();

    const slug = normalizeSlug(form.slug);

    if (!slug || !form.title.trim() || !form.title.trim()) {
      setMessage("Slug and title are required.");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      slug,
      title: form.title.trim(),
      title: form.title.trim(),
      title: form.title.trim(),
      content: form.content.trim(),
      content: form.content.trim(),
      content: form.content.trim(),
      content_type: form.content_type,
      cover_media: form.cover_media.trim() || null,
      published: form.published,
      updated_at: new Date().toISOString()
    };

    const query = editingId
      ? supabase
          .from("PageManagement")
          .update(payload)
          .eq("id", editingId)
      : supabase
          .from("PageManagement")
          .insert(payload);

    const { error } = await query;

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    resetForm();
    setMessage("Page saved successfully.");
    await loadPages();

    setSaving(false);
  }

  async function deletePage(id) {
    if (!window.confirm("Delete this page?")) {
      return;
    }

    const { error } = await supabase
      .from("PageManagement")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Page deleted successfully.");
    await loadPages();
  }

  async function togglePublished(page) {
    const { error } = await supabase
      .from("PageManagement")
      .update({
        published: !page.published,
        updated_at: new Date().toISOString()
      })
      .eq("id", page.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadPages();
  }

  async function copyPageLink(slug) {
    const url = `${window.location.origin}${base}${slug}`;

    try {
      await navigator.clipboard.writeText(url);
      setMessage("Page link copied.");
    } catch {
      setMessage(url);
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">
            Administration
          </p>
          <h1>Pages Manager</h1>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            onClick={onBack}
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={resetForm}
          >
            New Page
          </button>
        </div>
      </header>

      <section className="admin-content">
        <form
          onSubmit={savePage}
          className="admin-form"
        >
          <input
            type="text"
            placeholder="Page title (Bangla)"
            value={form.title}
            onChange={(event) => {
              const title = event.target.value;

              setForm((current) => ({
                ...current,
                title,
                slug:
                  !editingId &&
                  !current.slug.trim()
                    ? current.title
                      ? normalizeSlug(current.title)
                      : current.slug
                    : current.slug
              }));
            }}
          />

          <input
            type="text"
            placeholder="Page title (English)"
            value={form.title}
            onChange={(event) => {
              const title = event.target.value;

              setForm((current) => ({
                ...current,
                title,
                slug:
                  !editingId &&
                  !current.slug.trim()
                    ? normalizeSlug(title)
                    : current.slug
              }));
            }}
          />

          <input
            type="text"
            placeholder="Page slug"
            value={form.slug}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                slug: normalizeSlug(
                  event.target.value
                )
              }))
            }
          />

          <select
            value={form.content_type}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                content_type:
                  event.target.value
              }))
            }
          >
            {CONTENT_TYPES.map((type) => (
              <option
                key={type}
                value={type}
              >
                {type}
              </option>
            ))}
          </select>

          <textarea
            placeholder="Page content (Bangla)"
            value={form.content}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                content: event.target.value
              }))
            }
            rows={12}
          />

          <textarea
            placeholder="Page content (English)"
            value={form.content}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                content: event.target.value
              }))
            }
            rows={12}
          />

          <MediaInput
            value={form.cover_media}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                cover_media: value
              }))
            }
            folder="pages"
            accept="image/*"
          />

          <label>
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  published:
                    event.target.checked
                }))
              }
            />
            Published
          </label>

          <div className="admin-header-actions">
            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Page"
                  : "Create Page"}
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

          {message && <p>{message}</p>}
        </form>

        <div className="admin-list">
          {loading ? (
            <p>Loading...</p>
          ) : pages.length === 0 ? (
            <p>No pages found.</p>
          ) : (
            pages.map((page) => (
              <div
                key={page.id}
                className="admin-list-item"
              >
                <div>
                  <strong>
                    {page.title || page.title || page.title}
                  </strong>

                  <div>
                    {base}
                    {page.slug}
                  </div>

                  <div>
                    Type:{" "}
                    {page.content_type}
                  </div>

                  <div>
                    {page.published
                      ? "Published"
                      : "Hidden"}
                  </div>
                </div>

                <div className="admin-header-actions">
                  <button
                    type="button"
                    onClick={() =>
                      editPage(page)
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      togglePublished(page)
                    }
                  >
                    {page.published
                      ? "Hide"
                      : "Publish"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      copyPageLink(page.slug)
                    }
                  >
                    Copy Link
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deletePage(page.id)
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
