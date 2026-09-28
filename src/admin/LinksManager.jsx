import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function getRootDomain(value) {
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function getDomainIcon(domain) {
  if (!domain) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

export default function LinksManager() {
  const [links, setLinks] = useState([]);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadLinks();
  }, []);

  async function loadLinks() {
    setLoading(true);

    const { data, error } = await supabase
      .from("global_links")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      setMessage(error.message);
    } else {
      setLinks(data || []);
    }

    setLoading(false);
  }

  function resetForm() {
    setUrl("");
    setLabel("");
    setEnabled(true);
    setEditingId("");
    setMessage("");
  }

  function editLink(link) {
    setEditingId(link.id);
    setUrl(link.url || "");
    setLabel(link.label || "");
    setEnabled(link.enabled);
    setMessage("");
  }

  async function saveLink(event) {
    event.preventDefault();

    const cleanUrl = url.trim();
    const rootDomain = getRootDomain(cleanUrl);

    if (!rootDomain) {
      setMessage("Enter a valid URL.");
      return;
    }

    setSaving(true);
    setMessage("");

    const existingIcon = links.find(
      (link) => link.root_domain === rootDomain && link.icon
    )?.icon;

    const payload = {
      label: label.trim() || null,
      url: cleanUrl,
      root_domain: rootDomain,
      icon: existingIcon || getDomainIcon(rootDomain),
      enabled,
      updated_at: new Date().toISOString()
    };

    let error;

    if (editingId) {
      ({ error } = await supabase
        .from("global_links")
        .update(payload)
        .eq("id", editingId));
    } else {
      const maxOrder = links.reduce(
        (max, item) => Math.max(max, Number(item.sort_order) || 0),
        -1
      );

      ({ error } = await supabase
        .from("global_links")
        .insert({
          ...payload,
          sort_order: maxOrder + 1
        }));
    }

    if (error) {
      setMessage(error.message);
    } else {
      resetForm();
      await loadLinks();
      setMessage("Saved successfully.");
    }

    setSaving(false);
  }

  async function toggleLink(link) {
    const { error } = await supabase
      .from("global_links")
      .update({
        enabled: !link.enabled,
        updated_at: new Date().toISOString()
      })
      .eq("id", link.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadLinks();
  }

  async function deleteLink(id) {
    if (!window.confirm("Delete this link?")) return;

    const { error } = await supabase
      .from("global_links")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadLinks();
  }

  async function moveLink(index, direction) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= links.length) return;

    const current = links[index];
    const target = links[targetIndex];

    const firstOrder = Number(current.sort_order) || index;
    const secondOrder = Number(target.sort_order) || targetIndex;

    const { error } = await Promise.all([
      supabase
        .from("global_links")
        .update({ sort_order: secondOrder })
        .eq("id", current.id),
      supabase
        .from("global_links")
        .update({ sort_order: firstOrder })
        .eq("id", target.id)
    ]).then((results) => ({
      error: results.find((result) => result.error)?.error || null
    }));

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadLinks();
  }

  return (
    <main className="admin-page">
      <section className="admin-section">
        <h2>Link Management</h2>

        <form onSubmit={saveLink}>
          <label>
            Label
            <input
              type="text"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </label>

          <label>
            URL
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              required
            />
          </label>

          <label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
            Enabled
          </label>

          <div className="admin-header-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Link" : "Add Link"}
            </button>

            {editingId && (
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {message && <p>{message}</p>}

        <div className="admin-module-grid">
          {loading ? (
            <p>Loading...</p>
          ) : links.length === 0 ? (
            <p>No global links found.</p>
          ) : (
            links.map((link, index) => (
              <div className="admin-module" key={link.id}>
                {link.icon && (
                  <img
                    src={link.icon}
                    alt=""
                    width="32"
                    height="32"
                  />
                )}

                <strong>{link.label || link.root_domain}</strong>

                <span>
                  {link.root_domain} ·{" "}
                  {link.enabled ? "Enabled" : "Disabled"}
                </span>

                <div className="admin-header-actions">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveLink(index, -1)}
                  >
                    Up
                  </button>

                  <button
                    type="button"
                    disabled={index === links.length - 1}
                    onClick={() => moveLink(index, 1)}
                  >
                    Down
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleLink(link)}
                  >
                    {link.enabled ? "Disable" : "Enable"}
                  </button>

                  <button
                    type="button"
                    onClick={() => editLink(link)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteLink(link.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
