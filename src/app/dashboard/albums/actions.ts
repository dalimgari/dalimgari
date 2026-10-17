"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

function textField(formData: FormData, key: string, limit: number) {
  return String(formData.get(key) ?? "").trim().slice(0, limit);
}

function mediaIds(formData: FormData) {
  return formData.getAll("mediaIds")
    .map((value) => String(value))
    .filter((value) => /^[0-9a-f-]{36}$/i.test(value))
    .slice(0, 100);
}

function valid(title: string, url: string, visibility: string) {
  return title.length > 0 && title.length <= 180
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(url)
    && url.length <= 100
    && (visibility === "public" || visibility === "private");
}

export async function createAlbum(formData: FormData) {
  const { supabase } = await requireAdmin();
  const title = textField(formData, "title", 180);
  const url = textField(formData, "url", 100).toLowerCase();
  const description = textField(formData, "description", 1000);
  const visibility = textField(formData, "visibility", 20);
  const selectedMedia = mediaIds(formData);

  if (!valid(title, url, visibility)) redirect("/dashboard/albums?error=invalid");
  const { error } = await supabase.rpc("save_album", {
    p_album_id: null,
    p_title: title,
    p_description: description,
    p_url: url,
    p_visibility: visibility,
    p_media_ids: selectedMedia,
  });
  if (error) redirect("/dashboard/albums?error=save_failed");
  revalidatePath("/");
  revalidatePath("/albums");
  revalidatePath(`/gallery/${url}`);
  redirect("/dashboard/albums?created=1");
}

export async function updateAlbum(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = textField(formData, "id", 36);
  const title = textField(formData, "title", 180);
  const url = textField(formData, "url", 100).toLowerCase();
  const description = textField(formData, "description", 1000);
  const visibility = textField(formData, "visibility", 20);
  const selectedMedia = mediaIds(formData);

  if (!/^[0-9a-f-]{36}$/i.test(id) || !valid(title, url, visibility)) {
    redirect("/dashboard/albums?error=invalid");
  }
  const { error } = await supabase.rpc("save_album", {
    p_album_id: id,
    p_title: title,
    p_description: description,
    p_url: url,
    p_visibility: visibility,
    p_media_ids: selectedMedia,
  });
  if (error) redirect("/dashboard/albums?error=save_failed");
  revalidatePath("/");
  revalidatePath("/albums");
  revalidatePath(`/gallery/${url}`);
  redirect("/dashboard/albums?updated=1");
}
