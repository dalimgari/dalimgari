import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import MediaInput from "../components/MediaInput";

function makeSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function NewsManager({ onBack }) {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setExcerpt("");
    setContent("");
    setCoverImage("");
    setMessage("");
    setError("");
  }

  function editNews(item) {
    setEditingId(item.id);
    setTitle(item.title || "");
    setExcerpt(item.excerpt || "");
    setContent(item.content || "");
    setCoverImage(item.cover_image || "");
    setMessage("");
    setError("");
  }

  async function saveNews(event) {
    event.preventDefault();

    if (!title.trim()) {
      setError("News title is required.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    const { data: userData } = await supabase.auth.getUser();

    let error;

    if (editingId) {
      const result = await supabase
        .from("news")
        .update({
          title: title.trim(),
          excerpt: excerpt.trim() || null,
          content: content.trim() || null,
          cover_image: coverImage.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingId);

      error = result.error;
    } else {
      const slugBase = makeSlug(title);
      const slug = `${slugBase}-${Date.now()}`;

      const result = await supabase.from("news").insert({
        title: title.trim(),
        slug,
        excerpt: excerpt.trim() || null,
        content: content.trim() || null,
        cover_image: coverImage.trim() || null,
        author_id: userData?.user?.id || null,
        published: true,
        published_at: new Date().toISOString()
      });

      error = result.error;
    }

    if (error) {
      setError(error.message);
    } else {
      resetForm();
      setMessage(editingId ? "News updated successfully." : "News published successfully.");
      await loadNews();
    }

    setSaving(false);
  }

  async function deleteNews(id) {
    const { error } = await supabase
      .from("news")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("News deleted.");
    await loadNews();
  }

  return (
    <section>
      <div className="manager-header">
        <div>
          <p className="admin-eyebrow">Content</p>
          <h2>News Management</h2>
        </div>

        <button
          type="button"
          className="manager-back"
          onClick={onBack}
        >
          Dashboard
        </button>
      </div>

      <form className="manager-form" onSubmit={saveNews}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="News title"
          required
        />

        <textarea
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          placeholder="Short summary"
          rows="3"
        />

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Full news content"
          rows="7"
        />

        <MediaInput
          value={coverImage}
          onChange={setCoverImage}
          folder="news"
          accept="image/*"
        />

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : editingId ? "Update News" : "Publish News"}
        </button>

        {editingId && (
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        )}

        {message && <p className="manager-message">{message}</p>}
        {error && <p className="manager-error">{error}</p>}
      </form>

      <div className="manager-list">
        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p>No news available.</p>
        ) : (
          items.map((item) => (
            <article className="manager-item" key={item.id}>
              <div>
                <h3>{item.title}</h3>
                <p>{item.excerpt}</p>
                <small>
                  {item.published ? "Published" : "Draft"}
                </small>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => editNews(item)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteNews(item.id)}
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

export default NewsManager;
