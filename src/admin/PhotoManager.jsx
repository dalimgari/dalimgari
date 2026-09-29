import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import MediaInput from "../components/MediaInput";

function PhotoManager() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadGallery();
  }, []);

  async function loadGallery() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("gallery")
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
    setDescription("");
    setCategory("");
    setMediaUrl("");
    setMediaType("image");
    setMessage("");
    setError("");
  }

  function editGallery(item) {
    setEditingId(item.id);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setCategory(item.category || "");
    setMediaUrl(item.media_url || "");
    setMediaType(item.media_type || "image");
    setMessage("");
    setError("");
  }

  async function saveGallery(event) {
    event.preventDefault();

    if (!mediaUrl.trim()) {
      setError("Media is required.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    const { data: userData } = await supabase.auth.getUser();

    let saveError;

    if (editingId) {
      const result = await supabase
        .from("gallery")
        .update({
          title: title.trim() || null,
          description: description.trim() || null,
          media_url: mediaUrl.trim(),
          media_type: mediaType,
          category: category.trim() || null
        })
        .eq("id", editingId);

      saveError = result.error;
    } else {
      const result = await supabase
        .from("gallery")
        .insert({
          title: title.trim() || null,
          description: description.trim() || null,
          media_url: mediaUrl.trim(),
          media_type: mediaType,
          category: category.trim() || null,
          uploaded_by: userData?.user?.id || null,
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
          ? "Gallery item updated successfully."
          : "Gallery item added successfully."
      );
      await loadGallery();
    }

    setSaving(false);
  }

  async function deleteGallery(item) {
    const url = item.media_url || "";
    const marker = "/storage/v1/object/public/media/";

    if (url.includes(marker)) {
      const index = url.indexOf(marker);
      const filePath = decodeURIComponent(
        url.substring(index + marker.length)
      );

      await supabase.storage
        .from("media")
        .remove([filePath]);
    }

    const { error } = await supabase
      .from("gallery")
      .delete()
      .eq("id", item.id);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Gallery item deleted.");
    await loadGallery();
  }

  return (
    <section>
      <div className="manager-header">
        <div>
          <p className="admin-eyebrow">Media</p>
          <h2>Gallery Management</h2>
        </div>
      </div>

      <form className="manager-form" onSubmit={saveGallery}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Media title"
        />

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          rows="3"
        />

        <input
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Category"
        />

        <label>
          Media type
          <select
            value={mediaType}
            onChange={(event) => setMediaType(event.target.value)}
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </label>

        <MediaInput
          value={mediaUrl}
          onChange={setMediaUrl}
          folder="gallery"
          accept={mediaType === "video" ? "video/*" : "image/*"}
        />

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : editingId ? "Update Media" : "Add Media"}
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
          <p>No gallery items available.</p>
        ) : (
          items.map((item) => (
            <article className="manager-item" key={item.id}>
              <div>
                {item.media_type === "video" ? (
                  <video
                    src={item.media_url}
                    controls
                    style={{
                      width: "120px",
                      height: "80px",
                      objectFit: "cover",
                      borderRadius: "8px"
                    }}
                  />
                ) : (
                  <img
                    src={item.media_url}
                    alt={item.title || "Gallery image"}
                    style={{
                      width: "120px",
                      height: "80px",
                      objectFit: "cover",
                      borderRadius: "8px"
                    }}
                  />
                )}

                <h3>{item.title || "Untitled media"}</h3>

                {item.description && (
                  <p>{item.description}</p>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => editGallery(item)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteGallery(item)}
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

export default PhotoManager
