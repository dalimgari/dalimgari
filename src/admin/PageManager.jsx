import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import MediaInput from "../components/MediaInput";

const CONTENT_TYPES = [
  "information",
  "article",
  "photo-gallery",
  "video-gallery",
  "photo-video-gallery",
  "contact",
  "custom"
];

function PageManager({ onBack }) {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState("information");
  const [coverMedia, setCoverMedia] = useState("");
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPages() {
    setLoading(true);

    const { data, error } = await supabase
      .from("PageManagement")
      .select(
        "id, slug, title, content, content_type, cover_media, published, created_by, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setItems(data || []);
      setMessage("");
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
    setContentType("information");
    setCoverMedia("");
    setPublished(true);
  }

  function editPage(item) {
    setEditingId(item.id);
    setSlug(item.slug || "");
    setTitle(item.title || "");
    setContent(item.content || "");
    setContentType(item.content_type || "information");
    setCoverMedia(item.cover_media || "");
    setPublished(item.published ?? true);
    setMessage("");
  }

  async function savePage(event) {
    event.preventDefault();

    if (!slug.trim()) {
      setMessage("Slug is required.");
      return;
    }

    if (!title.trim()) {
      setMessage("Title is required.");
      return;
    }

    if (!CONTENT_TYPES.includes(contentType)) {
      setMessage("Invalid content type.");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      slug: slug.trim(),
      title: title.trim(),
      content: content.trim() || null,
      content_type: contentType,
      cover_media: coverMedia.trim() || null,
      published,
      updated_at: new Date().toISOString()
    };

    let error;

    if (editingId) {
      ({ error } = await supabase
        .from("PageManagement")
        .update(payload)
        .eq("id", editingId));
    } else {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      ({ error } = await supabase.from("PageManagement").insert({
        ...payload,
        created_by: user?.id || null
      }));
    }

    if (error) {
      setMessage(error.message);
    } else {
      resetForm();
      await loadPages();
      setMessage("Page saved successfully.");
    }

    setSaving(false);
  }

  async function deletePage(item) {
    if (!window.confirm(`Delete "${item.title || "this page"}"?`)) {
      return;
    }

    const { error } = await supabase
      .from("PageManagement")
      .delete()
      .eq("id", item.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (editingId === item.id) {
      resetForm();
    }

    await loadPages();
    setMessage("Page deleted successfully.");
  }

  return (
    <section>
      <div>
        <button type="button" onClick={onBack}>
          Back
        </button>

        <h2>Page Management</h2>
      </div>

      <form onSubmit={savePage}>
        <input
          type="text"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="Slug"
          required
        />

        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          required
        />

        <select
          value={contentType}
          onChange={(event) => setContentType(event.target.value)}
        >
          {CONTENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Content"
          rows="10"
        />

        <MediaInput
          value={coverMedia}
          onChange={setCoverMedia}
        />

        <label>
          <input
            type="checkbox"
            checked={published}
            onChange={(event) => setPublished(event.target.checked)}
          />
          Published
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : editingId ? "Update Page" : "Add Page"}
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
        ) : items.length === 0 ? (
          <p>No pages found.</p>
        ) : (
          items.map((item) => (
            <article key={item.id}>
              {item.cover_media && (
                <img
                  src={item.cover_media}
                  alt={item.title || "Page cover"}
                  style={{
                    maxWidth: "240px",
                    display: "block",
                    marginTop: "10px"
                  }}
                />
              )}

              <h3>{item.title}</h3>

              <small>
                {item.slug} · {item.content_type} ·{" "}
                {item.published ? "Published" : "Draft"}
              </small>

              {item.content && <p>{item.content}</p>}

              <div>
                <button type="button" onClick={() => editPage(item)}>
                  Edit
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deletePage(item)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default PageManager;
