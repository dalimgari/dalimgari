import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function MessagesManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  }

  async function updateStatus(id, status) {
    const { error } = await supabase
      .from("contact_messages")
      .update({ status })
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    await loadMessages();
  }

  async function deleteMessage(id) {
    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    await loadMessages();
  }

  return (
    <section>
      <div className="manager-header">
        <div>
          <p className="admin-eyebrow">Communication</p>
          <h2>Messages</h2>
        </div>
      </div>

      {error && <p className="manager-error">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>No messages available.</p>
      ) : (
        <div className="manager-list">
          {items.map((item) => (
            <article className="manager-item" key={item.id}>
              <div>
                <h3>{item.subject || "No subject"}</h3>

                <p>
                  <strong>{item.name}</strong>
                  {item.email ? ` — ${item.email}` : ""}
                  {item.phone ? ` — ${item.phone}` : ""}
                </p>

                <p>{item.message}</p>

                <small>
                  Status: {item.status} ·{" "}
                  {new Date(item.created_at).toLocaleString()}
                </small>

                <div>
                  <button
                    type="button"
                    onClick={() => updateStatus(item.id, "read")}
                  >
                    Mark Read
                  </button>

                  <button
                    type="button"
                    onClick={() => updateStatus(item.id, "replied")}
                  >
                    Mark Replied
                  </button>

                  <button
                    type="button"
                    onClick={() => updateStatus(item.id, "archived")}
                  >
                    Archive
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => deleteMessage(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default MessagesManager;
