import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import MediaInput from "../components/MediaInput";

function PostManager({ onBack }) {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("PostManagement")
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
    setMediaUrl("");
    setMediaType("image");
    setPublished(true);
    setMessage("");
    setError("");
  }

  function editPost(item) {
    setEditingId(item.id);
    setTitle(item.title || "");
    setContent(item.content || "");
    setMediaUrl(item.media_url || "");
    setMediaType(item.media_type || "image");
    setPublished(Boolean(item.published));
    setMessage("");
    setError("");
  }

  async function savePost(event) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Post title is required.");
      return;
    }

    if (!content.trim()) {
      setError("Post content is required.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      title: title.trim(),
      content: content.trim(),
      media_url: mediaUrl.trim() || null,
      media_type: mediaUrl.trim() ? mediaType : null,
      published,
      updated_at: new Date().toISOString()
    };

    let saveError;

    if (editingId) {
      const result = await supabase
        .from("PostManagement")
        .update(payload)
        .eq("id", editingId);

      saveError = result.error;
    } else {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user?.id) {
        setError("Authentication required.");
        setSaving(false);
        return;
      }

      const result = await supabase
        .from("PostManagement")
        .insert({
          ...payload,
          author_id: userData.user.id
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
          ? "Post updated successfully."
          : "Post published successfully."
      );
      await loadPosts();
    }

    setSaving(false);
  }

  async function deletePost(item) {
    const url = item.media_url || "";
    const marker = "/storage/v1/object/public/media/";

    if (url.includes(marker)) {
      const index = url.indexOf(marker);
      const filePath = decodeURIComponent(
        url.substring(index + marker.length)
      );

      await supabase.storage.from("media").remove([filePath]);
    }

    const { error } = await supabase
      .from("PostManagement")
      .delete()
      .eq("id", item.id);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Post deleted.");
    await loadPosts();
  }

  return (
    <section>
      <div className="manager-header">
        <div>
          <p className="admin-eyebrow">Community</p>
          <h2>Post Management</h2>
        </div>

        {onBack && (
          <button type="button" onClick={onBack}>
            Back
          </button>
        )}
      </div>

      <form className="manager-form" onSubmit={savePost}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Post title"
          required
        />

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Post content"
          rows="7"
          required
        />

        <select
          value={mediaType}
          onChange={(event) => setMediaType(event.target.value)}
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>

        <MediaInput
          value={mediaUrl}
          onChange={setMediaUrl}
          folder="PostManagement"
          accept={mediaType === "video" ? "video/*" : "image/*"}
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
          {saving
            ? "Saving..."
            : editingId
              ? "Update Post"
              : "Publish Post"}
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
          <p>No posts available.</p>
        ) : (
          items.map((item) => (
            <article className="manager-item" key={item.id}>
              <div>
                <h3>{item.title}</h3>
                <p>{item.content}</p>

                {item.media_url && item.media_type === "video" && (
                  <video
                    src={item.media_url}
                    controls
                    preload="metadata"
                    style={{
                      maxWidth: "320px",
                      display: "block",
                      marginTop: "10px"
                    }}
                  />
                )}

                {item.media_url && item.media_type === "image" && (
                  <img
                    src={item.media_url}
                    alt={item.title}
                    style={{
                      maxWidth: "240px",
                      display: "block",
                      marginTop: "10px"
                    }}
                  />
                )}

                <small>
                  {item.published ? "Published" : "Draft"}
                  {item.media_type ? ` · ${item.media_type}` : ""}
                </small>
              </div>

              <div>
                <button type="button" onClick={() => editPost(item)}>
                  Edit
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deletePost(item)}
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

export default PostManager;
