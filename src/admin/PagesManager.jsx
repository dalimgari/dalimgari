import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import MediaInput from "./MediaInput";

const CONTENT_TYPES = [
  "info",
  "article",
  "gallery",
  "people",
  "video",
  "news",
  "events",
  "custom"
];

function PagesManager({ onBack }) {
  const [pages, setPages] = useState([]);
  const [form, setForm] = useState({
    id: "",
    title: "",
    slug: "",
    content_type: "custom",
    content: "",
    cover_image: "",
    published: true
  });
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    const { data, error } = await supabase
      .from("pages")
      .select(
        "id, slug, title, content, content_type, cover_image, published, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setPages(data || []);
  }

  function resetForm() {
    setForm({
      id: "",
      title: "",
      slug: "",
      content_type: "custom",
      content: "",
      cover_image: "",
      published: true
    });
    setEditing(false);
    setMessage("");
  }

  function makeSlug(value) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function editPage(page) {
    setForm({
      id: page.id,
      title: page.title || "",
      slug: page.slug || "",
      content_type: page.content_type || "custom",
      content: page.content || "",
      cover_image: page.cover_image || "",
      published: page.published
    });
    setEditing(true);
    setMessage("");
  }

  async function savePage(event) {
    event.preventDefault();
    setMessage("");

    if (!form.title.trim()) {
      setMessage("Page title is required.");
      return;
    }

    const slug = makeSlug(form.slug || form.title);

    if (!slug) {
      setMessage("A valid URL slug is required.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      slug,
      content_type: form.content_type,
      content: form.content.trim(),
      cover_image: form.cover_image || null,
      published: form.published,
      updated_at: new Date().toISOString()
    };

    let result;

    if (editing) {
      result = await supabase
        .from("pages")
        .update(payload)
        .eq("id", form.id);
    } else {
      result = await supabase
        .from("pages")
        .insert(payload);
    }

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    resetForm();
    setMessage("Page saved successfully.");
    await loadPages();
  }

  async function togglePublished(page) {
    const { error } = await supabase
      .from("pages")
      .update({
        published: !page.published,
        updated_at: new Date().toISOString()
      })
      .eq("id", page.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadPages();
  }

  async function deletePage(page) {
    if (!window.confirm("Delete this page?")) {
      return;
    }

    const { error } = await supabase
      .from("pages")
      .delete()
      .eq("id", page.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (form.id === page.id) {
      resetForm();
    }

    setMessage("Page deleted successfully.");
    await loadPages();
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">
            Administration
          </p>
          <h1>Pages</h1>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            onClick={onBack}
          >
            Dashboard
          </button>
        </div>
      </header>

      <section className="admin-content">
        <div className="admin-welcome">
          <h2>
            {editing ? "Edit Page" : "Create Page"}
          </h2>
          <p>
            Create a page and select its content type.
          </p>
        </div>

        <form
          className="admin-form"
          onSubmit={savePage}
        >
          <label>
            Page Name
            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm({
                  ...form,
                  title: event.target.value
                })
              }
              required
            />
          </label>

          <label>
            URL Slug
            <input
              type="text"
              value={form.slug}
              onChange={(event) =>
                setForm({
                  ...form,
                  slug: event.target.value
                })
              }
              placeholder="page-url"
            />
          </label>

          <label>
            Content Type
            <select
              value={form.content_type}
              onChange={(event) =>
                setForm({
                  ...form,
                  content_type: event.target.value
                })
              }
            >
              {CONTENT_TYPES.map((type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label>
            Content
            <textarea
              rows="10"
              value={form.content}
              onChange={(event) =>
                setForm({
                  ...form,
                  content: event.target.value
                })
              }
            />
          </label>

          <label>
            Cover Media
            <MediaInput
              value={form.cover_image}
              onChange={(value) =>
                setForm({
                  ...form,
                  cover_image: value
                })
              }
              folder="pages"
              accept={
                form.content_type === "video"
                  ? "video/*"
                  : "image/*,video/*"
              }
            />
          </label>

          <label>
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) =>
                setForm({
                  ...form,
                  published: event.target.checked
                })
              }
            />
            Published
          </label>

          <div className="admin-header-actions">
            <button type="submit">
              {editing ? "Update Page" : "Save Page"}
            </button>

            {editing && (
              <button
                type="button"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {message && <p>{message}</p>}

        <div className="admin-module-grid">
          {pages.map((page) => (
            <div
              className="admin-module"
              key={page.id}
            >
              <strong>{page.title}</strong>

              <span>
                /{page.slug} · {page.content_type} ·{" "}
                {page.published
                  ? "Published"
                  : "Hidden"}
              </span>

              <div className="admin-header-actions">
                <button
                  type="button"
                  onClick={() =>
                    togglePublished(page)
                  }
                >
                  {page.published
                    ? "Hide"
                    : "Publish"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    editPage(page)
                  }
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() =>
                    deletePage(page)
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default PagesManager;
