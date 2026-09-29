import { useState } from "react";
import { supabase } from "../lib/supabaseclient";

export default function MediaInput({
  value,
  onChange,
  folder = "media",
  accept = "*/*"
}) {
  const [mode, setMode] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setMessage("");

    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-");

    const path = `${folder}/${crypto.randomUUID()}-${safeName}`;

    const { error } = await supabase.storage
      .from("media")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (error) {
      setMessage(error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("media")
      .getPublicUrl(path);

    onChange(data.publicUrl);
    setMessage("File uploaded successfully.");
    setUploading(false);
  }

  return (
    <div className="media-input">
      <div>
        <button
          type="button"
          onClick={() => setMode("upload")}
        >
          Direct Upload
        </button>

        <button
          type="button"
          onClick={() => setMode("url")}
        >
          External URL
        </button>
      </div>

      {mode === "upload" ? (
        <input
          type="file"
          accept={accept}
          onChange={handleUpload}
          disabled={uploading}
        />
      ) : (
        <input
          type="url"
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder="External media URL"
        />
      )}

      {uploading && <p>Uploading...</p>}
      {message && <p>{message}</p>}

      {value && (
        <input
          type="text"
          value={value}
          readOnly
        />
      )}
    </div>
  );
}
