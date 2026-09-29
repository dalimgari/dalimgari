import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseclient";
import MediaInput from "../components/MediaInput";

function VideoManager({ onBack }) {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadVideos() {
    setLoading(true);

    const { data, error } = await supabase
      .from("VideoManagement")
      .select(
        "id, title, description, category, media_url, published, uploaded_by, created_at, updated_at"
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
    loadVideos();
  }, []);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setCategory("");
    setMediaUrl("");
    setPublished(true);
  }

  function editVideo(item) {
    setEditingId(item.id);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setCategory(item.category || "");
    setMediaUrl(item.media_url || "");
    setPublished(item.published ?? true);
    setMessage("");
  }

  async function saveVideo(event) {
    event.preventDefault();

    if (!title.trim()) {
      setMessage("Title is required.");
      return;
    }

    if (!mediaUrl.trim()) {
      setMessage("Video URL is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      category: category.trim() || null,
      media_url: mediaUrl.trim(),
      published,
      updated_at: new Date().toISOString()
    };

    let error;

    if (editingId) {
      ({ error } = await supabase
        .from("VideoManagement")
        .update(payload)
        .eq("id", editingId));
    } else {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      ({ error } = await supabase.from("VideoManagement").insert({
        ...payload,
        uploaded_by: user?.id || null
      }));
    }

    if (error) {
      setMessage(error.message);
    } else {
      resetForm();
      await loadVideos();
      setMessage("Video saved successfully.");
    }

    setSaving(false);
  }

  async function deleteVideo(item) {
    if (!window.confirm(`Delete "${item.title || "this video"}"?`)) {
      return;
    }

    const { error } = await supabase
      .from("VideoManagement")
      .delete()
      .eq("id", item.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (editingId === item.id) {
      resetForm();
    }

    await loadVideos();
    setMessage("Video deleted successfully.");
  }

  return (
    <section>
      <div>
        <button type="button" onClick={onBack}>
          Back
        </button>

        <h2>Video Management</h2>
      </div>

      <form onSubmit={saveVideo}>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          required
        />

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
        />

        <input
          type="text"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Category"
        />

        <MediaInput
          value={mediaUrl}
          onChange={setMediaUrl}
          accept="video/*"
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
          {saving ? "Saving..." : editingId ? "Update Video" : "Add Video"}
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
          <p>No videos found.</p>
        ) : (
          items.map((item) => (
            <article key={item.id}>
              <div>
                {item.media_url && (
                  <video
                    src={item.media_url}
                    controls
                    style={{
                      maxWidth: "360px",
                      display: "block",
                      marginTop: "10px"
                    }}
                  />
                )}

                <h3>{item.title}</h3>

                {item.description && <p>{item.description}</p>}

                {item.category && <small>{item.category}</small>}

                <small>
                  {item.published ? "Published" : "Draft"}
                </small>
              </div>

              <div>
                <button type="button" onClick={() => editVideo(item)}>
                  Edit
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteVideo(item)}
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

export default VideoManager;
