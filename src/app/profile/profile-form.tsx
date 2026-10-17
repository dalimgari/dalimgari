"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  email: string;
  role: string;
  fullName: string;
  bio: string;
  phone: string;
  avatarUrl: string | null;
};

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const AVATAR_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function ProfileForm({ email, role, fullName, bio, phone, avatarUrl: initialAvatarUrl }: Props) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("full_name") ?? "").trim().slice(0, 120);
    const nextBio = String(form.get("bio") ?? "").trim().slice(0, 1000);
    const nextPhone = String(form.get("phone") ?? "").trim().slice(0, 30);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Please sign in again.");
      const { error: updateError } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: name || null,
        bio: nextBio || null,
        phone: nextPhone || null,
        updated_at: new Date().toISOString(),
      });
      if (updateError) throw updateError;
      setMessage("Profile saved.");
      router.refresh();
    } catch {
      setError("The profile could not be saved. Check your connection and permissions.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadAvatar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const selected = form.get("avatar");
    const file = selected instanceof File ? selected : null;
    if (!file || !AVATAR_TYPES[file.type] || file.size <= 0 || file.size > MAX_AVATAR_SIZE) {
      setError("Choose a JPG, PNG, or WebP image up to 5 MB.");
      setBusy(false);
      return;
    }
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Please sign in again.");
      const path = `${user.id}/${crypto.randomUUID()}.${AVATAR_TYPES[file.type]}`;
      const { error: uploadError } = await supabase.storage.from("profile-pictures").upload(path, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const publicUrl = supabase.storage.from("profile-pictures").getPublicUrl(path).data.publicUrl;
      const { error: updateError } = await supabase.from("profiles").upsert({
        id: user.id,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      });
      if (updateError) throw updateError;
      setAvatarUrl(publicUrl);
      setMessage("Profile picture updated.");
      formElement.reset();
      router.refresh();
    } catch {
      setError("The profile picture could not be uploaded. Check the file and storage permissions.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="profile-layout">
      <article className="card profile-summary">
        {avatarUrl ? <Image className="profile-avatar" src={avatarUrl} alt="Profile picture" width={120} height={120} unoptimized /> :
          <div className="profile-avatar profile-avatar-placeholder" aria-hidden="true">{(fullName || email).slice(0, 1).toUpperCase()}</div>}
        <h2>{fullName || "Community member"}</h2>
        <p>{email}</p>
        <p className="eyebrow">{role}</p>
      </article>
      <article className="card">
        <h2>Edit profile</h2>
        <form className="form wide-form" onSubmit={saveProfile}>
          <label>Full name
            <input name="full_name" defaultValue={fullName} maxLength={120} />
          </label>
          <label>Phone
            <input name="phone" type="tel" defaultValue={phone} maxLength={30} autoComplete="tel" />
          </label>
          <label>Bio
            <textarea name="bio" defaultValue={bio} rows={4} maxLength={1000} />
          </label>
          <button className="button" type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
        </form>
      </article>
      <article className="card">
        <h2>Profile picture</h2>
        <p className="muted-note">Images are stored in Supabase Storage in their original JPG, PNG, or WebP format. No Base64 image data is stored in the database.</p>
        <form className="form wide-form" onSubmit={uploadAvatar}>
          <label>Choose image
            <input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" required />
          </label>
          <button className="button secondary" type="submit" disabled={busy}>{busy ? "Uploading…" : "Upload picture"}</button>
        </form>
      </article>
      {message && <p role="status" className="form-success">{message}</p>}
      {error && <p role="alert" className="form-error">{error}</p>}
    </section>
  );
}
