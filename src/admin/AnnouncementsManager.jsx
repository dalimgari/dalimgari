import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function AnnouncementsManager() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("announcements")
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
    setContent("");
    setPriority("normal");
    setExpiresAt("");
    setMessage("");
    setError("");
  }

  function editAnnouncement(item) {
    setEditingId(item.id);
    setTitle(item.title || "");
    setContent(item.content || "");
    setPriority(item.priority || "normal");
    setExpiresAt(
      item.expires_at
        ? new Date(item.expires_at).toISOString().slice(0, 16)
        : ""
    );
    setMessage("");
    setError("");
  }

  async function saveAnnouncement(event) {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError("Announcement title and content are required.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    let saveError;

    if (editingId) {
      const result = await supabase
        .from("announcements")
        .update({
          title: title.trim(),
          content: content.trim(),
          priority,
          expires_at: expiresAt
            ? new Date(expiresAt).toISOString()
            : null,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingId);

      saveError = result.error;
    } else {
      const result = await supabase
        .from("announcements")
        .insert({
          title: title.trim(),
          content: content.trim(),
          priority,
          expires_at: expiresAt
            ? new Date(expiresAt).toISOString()
            : null,
          published: true
        });

      saveError = result.error;
    }

    if (saveError) {
      setError(saveError.message);
    } else {
      const wasEditing = Boolean(editingId);
      resetForm();
      setMessage(
        wasEditing
          ? "Announcement updated successfully."
          : "Announcement published successfully."
      );
      await loadAnnouncements();
    }

    setSaving(false);
  }

  async function deleteAnnouncement(id) {
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Announcement deleted.");
    await loadAnnouncements();
  }

  return (
    <section>
      <div className="manager-header">
        <div>
          <p className="admin-eyebrow">Content</p>
          <h2>Announcements Management</h2>
        </div>
      </div>

      <form className="manager-form" onSubmit={saveAnnouncement}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Announcement title"
          required
        />

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Announcement content"
          rows="6"
          required
        />

        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
        >
          <option value="low">Low priority</option>
          <option value="normal">Normal priority</option>
          <option value="high">High priority</option>
        </select>

        <label>
          Expiration date and time
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving
            ? "Saving..."
            : editingId
              ? "Update Announcement"
              : "Publish Announcement"}
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
          <p>No announcements available.</p>
        ) : (
          items.map((item) => (
            <article className="manager-item" key={item.id}>
              <div>
                <h3>{item.title}</h3>
                <p>{item.content}</p>
                <small>
                  Priority: {item.priority}
                </small>

                {item.expires_at && (
                  <small>
                    Expires:{" "}
                    {new Date(item.expires_at).toLocaleString()}
                  </small>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => editAnnouncement(item)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteAnnouncement(item.id)}
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

export default AnnouncementsManager;
