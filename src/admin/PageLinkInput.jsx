import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function PageLinkInput({
  value,
  onChange,
  label = "Link to Page"
}) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    const { data } = await supabase
      .from("pages")
      .select("id, slug, title, content_type")
      .eq("published", true)
      .order("title", {
        ascending: true
      });

    setPages(data || []);
    setLoading(false);
  }

  const selectedPage =
    pages.find(
      (page) => page.id === value
    ) || null;

  return (
    <label>
      {label}

      <select
        value={value || ""}
        onChange={(event) =>
          onChange(event.target.value || "")
        }
        disabled={loading}
      >
        <option value="">
          {loading
            ? "Loading pages..."
            : "Select a page"}
        </option>

        {pages.map((page) => (
          <option
            key={page.id}
            value={page.id}
          >
            {page.title}
          </option>
        ))}
      </select>

      {selectedPage && (
        <small>
          /{selectedPage.slug}
        </small>
      )}
    </label>
  );
}
