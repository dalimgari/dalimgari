import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import MediaInput from "../components/MediaInput";

function EventsManager({ onBack }) {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("start_at", { ascending: true });

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
    setLocation("");
    setStartAt("");
    setEndAt("");
    setCoverImage("");
    setMessage("");
    setError("");
  }

  function editEvent(item) {
    setEditingId(item.id);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setLocation(item.location || "");
    setStartAt(item.start_at ? new Date(item.start_at).toISOString().slice(0, 16) : "");
    setEndAt(item.end_at ? new Date(item.end_at).toISOString().slice(0, 16) : "");
    setCoverImage(item.cover_image || "");
    setMessage("");
    setError("");
  }

  async function saveEvent(event) {
    event.preventDefault();

    if (!title.trim() || !startAt) {
      setError("Event title and start date/time are required.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    const { data: userData } = await supabase.auth.getUser();

    let error;

    if (editingId) {
      const result = await supabase
        .from("events")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          start_at: new Date(startAt).toISOString(),
          end_at: endAt ? new Date(endAt).toISOString() : null,
          cover_image: coverImage.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingId);

      error = result.error;
    } else {
      const result = await supabase.from("events").insert({
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        start_at: new Date(startAt).toISOString(),
        end_at: endAt ? new Date(endAt).toISOString() : null,
        cover_image: coverImage.trim() || null,
        created_by: userData?.user?.id || null,
        published: true
      });

      error = result.error;
    }

    if (error) {
      setError(error.message);
    } else {
      resetForm();
      setMessage(editingId ? "Event updated successfully." : "Event published successfully.");
      await loadEvents();
    }

    setSaving(false);
  }

  async function deleteEvent(id) {
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Event deleted.");
    await loadEvents();
  }

  return (
    <section>
      <div className="manager-header">
        <div>
          <p className="admin-eyebrow">Content</p>
          <h2>Events Management</h2>
        </div>

        <button
          type="button"
          className="manager-back"
          onClick={onBack}
        >
          Dashboard
        </button>
      </div>

      <form className="manager-form" onSubmit={saveEvent}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Event title"
          required
        />

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Event description"
          rows="4"
        />

        <input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Location"
        />

        <label>
          Start date and time
          <input
            type="datetime-local"
            value={startAt}
            onChange={(event) => setStartAt(event.target.value)}
            required
          />
        </label>

        <label>
          End date and time
          <input
            type="datetime-local"
            value={endAt}
            onChange={(event) => setEndAt(event.target.value)}
          />
        </label>

        <MediaInput
          value={coverImage}
          onChange={setCoverImage}
          folder="events"
          accept="image/*"
        />

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : editingId ? "Update Event" : "Publish Event"}
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
          <p>No events available.</p>
        ) : (
          items.map((item) => (
            <article className="manager-item" key={item.id}>
              <div>
                <h3>{item.title}</h3>

                <p>{item.description}</p>

                {item.location && (
                  <small>{item.location}</small>
                )}

                <small>
                  {new Date(item.start_at).toLocaleString()}
                </small>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => editEvent(item)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteEvent(item.id)}
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

export default EventsManager;
