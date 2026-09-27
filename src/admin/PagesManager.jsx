import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import MediaInput from "./MediaInput";

export default function PagesManager({ onBack }) {
  const [pages, setPages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPages() {
    setLoading(true);

    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setPages(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadPages();
  }, []);

  function resetForm() {
    setEditingId(null);
    setSlug("");
    setTitle("");
    setContent("");
    setCoverImage("");
    setPublished(true);
    setMessage("");
  }

  function normalizeSlug(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleTitleChange(value) {
    setTitle(value);

    if (!editingId && !slug.trim()) {
      setSlug(normalizeSlug(value));
    }
  }

  function editPage(page) {
    setEditingId(page.id);
    setSlug(page.slug || "");
    setTitle(page.title || "");
    setContent(page.content || "");
    setCoverImage(page.cover_image || "");
    setPublished(page.published !== false);
    setMessage("");
  }

  async function savePage(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const normalizedSlug = normalizeSlug(slug);

    const payload = {
      slug: normalizedSlug,
      title: title.trim(),
      content: content.trim(),
      cover_image: coverImage.trim() || null,
      published,
      updated_at: new Date().toISOString()
    };

    if (!payload.slug || !payload.title.trim()) {
      setMessage("Slug and title are required.");
      setSaving(false);
      return;
    }

    const query = editingId
      ? supabase.from("pages").update(payload).eq("id", editingId)
      : supabase.from("pages").insert(payload);

    const { error } = await query;

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Page saved successfully.");
      resetForm();
      await loadPages();
    }

    setSaving(false);
  }

  async function deletePage(id) {
    if (!window.confirm("Delete this page?")) return;

    const { error } = await supabase
      .from("pages")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Page deleted successfully.");
      await loadPages();
    }
  }

  return (
    <div className="admin-manager">
      <div className="admin-manager-header">
        <button type="button" onClick={onBack}>
          Dashboard
        </button>
        <h2>Pages Manager</h2>
        <button type="button" onClick={resetForm}>
          New Page
        </button>
      </div>

      <form onSubmit={savePage} className="admin-form">
        <input
          type="text"
          placeholder="Page slug"
          value={slug}
          onChange={(event) => setSlug(normalizeSlug(event.target.value))}
        />

        <input
          type="text"
          placeholder="Page title"
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
        />

        <textarea
          placeholder="Page content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={10}
        />

        <MediaInput
          value={coverImage}
          onChange={setCoverImage}
          folder="pages"
          accept="image/*"
        />

        <label>
          <input
            type="checkbox"
            checked={published}
            onChange={(event) => setPublished(event.target.checked)}
          />
          Published
        </label>

        <div>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Page"}
          </button>

          {editingId && (
            <button type="button" onClick={resetForm}>
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
            <div key={page.id} className="admin-list-item">
              <div>
                <strong>{page.title}</strong>
                <div>/{page.slug}</div>
                <div>{page.published ? "Published" : "Draft"}</div>
              </div>

              <div>
                <button type="button" onClick={() => editPage(page)}>
                  Edit
                </button>
                <button type="button" onClick={() => deletePage(page.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
