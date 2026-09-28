import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import MediaInput from "../components/MediaInput";

function DocumentsManager() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("application/pdf");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("documents")
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
    setFileUrl("");
    setFileType("application/pdf");
    setMessage("");
    setError("");
  }

  function editDocument(item) {
    setEditingId(item.id);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setFileUrl(item.file_url || "");
    setFileType(item.file_type || "application/pdf");
    setMessage("");
    setError("");
  }

  async function saveDocument(event) {
    event.preventDefault();

    if (!title.trim() || !fileUrl.trim()) {
      setError("Document title and file are required.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    const { data: userData } = await supabase.auth.getUser();

    let saveError;

    if (editingId) {
      const result = await supabase
        .from("documents")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          file_url: fileUrl.trim(),
          file_type: fileType.trim() || null
        })
        .eq("id", editingId);

      saveError = result.error;
    } else {
      const result = await supabase
        .from("documents")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          file_url: fileUrl.trim(),
          file_type: fileType.trim() || null,
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
          ? "Document updated successfully."
          : "Document added successfully."
      );
      await loadDocuments();
    }

    setSaving(false);
  }

  async function deleteDocument(item) {
    const url = item.file_url || "";
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
      .from("documents")
      .delete()
      .eq("id", item.id);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Document deleted.");
    await loadDocuments();
  }

  return (
    <section>
      <div className="manager-header">
        <div>
          <p className="admin-eyebrow">Files</p>
          <h2>Documents Management</h2>
        </div>
      </div>

      <form className="manager-form" onSubmit={saveDocument}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Document title"
          required
        />

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          rows="3"
        />

        <select
          value={fileType}
          onChange={(event) => setFileType(event.target.value)}
        >
          <option value="application/pdf">PDF</option>
          <option value="text/plain">Text</option>
          <option value="application/msword">Word</option>
          <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">
            Word Document
          </option>
          <option value="application/vnd.ms-excel">Excel</option>
          <option value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
            Excel Spreadsheet
          </option>
          <option value="other">Other</option>
        </select>

        <MediaInput
          value={fileUrl}
          onChange={setFileUrl}
          folder="documents"
          accept=".pdf,.txt,.doc,.docx,.xls,.xlsx"
        />

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : editingId ? "Update Document" : "Add Document"}
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
          <p>No documents available.</p>
        ) : (
          items.map((item) => (
            <article className="manager-item" key={item.id}>
              <div>
                <h3>{item.title}</h3>

                {item.description && (
                  <p>{item.description}</p>
                )}

                <small>{item.file_type || "Document"}</small>

                <div>
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Document
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => editDocument(item)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteDocument(item)}
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

export default DocumentsManager;
