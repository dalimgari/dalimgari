import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseclient";

function LinkManager({ onBack }) {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [rootDomain, setRootDomain] = useState("");
  const [icon, setIcon] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [footerEnabled, setFooterEnabled] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadLinks() {
    setLoading(true);

    const { data, error } = await supabase
      .from("LinkManagement")
      .select(
        "id, label, url, root_domain, icon, enabled, footer_enabled, sort_order, created_at, updated_at"
      )
      .order("sort_order", { ascending: true });

    if (error) {
      setMessage(error.message);
    } else {
      setItems(data || []);
      setMessage("");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadLinks();
  }, []);

  function resetForm() {
    setEditingId(null);
    setLabel("");
    setUrl("");
    setRootDomain("");
    setIcon("");
    setEnabled(true);
    setFooterEnabled(true);
    setSortOrder(0);
  }

  function editLink(item) {
    setEditingId(item.id);
    setLabel(item.label || "");
    setUrl(item.url || "");
    setRootDomain(item.root_domain || "");
    setIcon(item.icon || "");
    setEnabled(item.enabled ?? true);
    setFooterEnabled(item.footer_enabled ?? true);
    setSortOrder(item.sort_order ?? 0);
    setMessage("");
  }

  async function saveLink(event) {
    event.preventDefault();

    if (!label.trim()) {
      setMessage("Label is required.");
      return;
    }

    if (!url.trim()) {
      setMessage("URL is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      label: label.trim(),
      url: url.trim(),
      root_domain: rootDomain.trim() || null,
      icon: icon.trim() || null,
      enabled,
      footer_enabled: footerEnabled,
      sort_order: Number(sortOrder) || 0,
      updated_at: new Date().toISOString()
    };

    let error;

    if (editingId) {
      ({ error } = await supabase
        .from("LinkManagement")
        .update(payload)
        .eq("id", editingId));
    } else {
      ({ error } = await supabase
        .from("LinkManagement")
        .insert(payload));
    }

    if (error) {
      setMessage(error.message);
    } else {
      resetForm();
      await loadLinks();
      setMessage("Link saved successfully.");
    }

    setSaving(false);
  }

  async function deleteLink(item) {
    if (!window.confirm(`Delete "${item.label}"?`)) {
      return;
    }

    const { error } = await supabase
      .from("LinkManagement")
      .delete()
      .eq("id", item.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (editingId === item.id) {
      resetForm();
    }

    await loadLinks();
    setMessage("Link deleted successfully.");
  }

  return (
    <section>
      <div>
        <button type="button" onClick={onBack}>
          Back
        </button>

        <h2>Link Management</h2>
      </div>

      <form onSubmit={saveLink}>
        <input
          type="text"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Label"
          required
        />

        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="URL"
          required
        />

        <input
          type="text"
          value={rootDomain}
          onChange={(event) => setRootDomain(event.target.value)}
          placeholder="Root Domain"
        />

        <input
          type="text"
          value={icon}
          onChange={(event) => setIcon(event.target.value)}
          placeholder="Icon"
        />

        <input
          type="number"
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          placeholder="Sort Order"
        />

        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          Enabled
        </label>

        <label>
          <input
            type="checkbox"
            checked={footerEnabled}
            onChange={(event) => setFooterEnabled(event.target.checked)}
          />
          Show in Footer
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : editingId ? "Update Link" : "Add Link"}
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
          <p>No links found.</p>
        ) : (
          items.map((item) => (
            <article key={item.id}>
              <h3>{item.label}</h3>

              <p>
                {item.url}
                <br />
                {item.root_domain || "No domain"}
                <br />
                {item.enabled ? "Enabled" : "Disabled"}
                {" · "}
                {item.footer_enabled ? "Footer" : "Hidden from Footer"}
                {" · Order: "}
                {item.sort_order}
              </p>

              {item.icon && <small>Icon: {item.icon}</small>}

              <div>
                <button type="button" onClick={() => editLink(item)}>
                  Edit
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteLink(item)}
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

export default LinkManager;
