"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeManagedHtml } from "@/lib/sanitize-managed-html";
import { requireAdmin } from "@/lib/auth/require-admin";

function readText(formData: FormData, key: string, maxLength: number) {
  return String(formData.get(key) ?? "").trim().slice(0, maxLength);
}

function validatePage(title: string, slug: string, content: string, visibility: string) {
  return title.length >= 1
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    && slug.length <= 100
    && content.length <= 100000
    && (visibility === "public" || visibility === "private");
}

export async function createPage(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const title = readText(formData, "title", 180);
  const slug = readText(formData, "url", 100).toLowerCase();
  const contentInput = String(formData.get("content") ?? "");
  const visibility = readText(formData, "visibility", 20);

  if (!validatePage(title, slug, contentInput, visibility)) {
    redirect("/dashboard/pages?error=invalid");
  }

  const safeContent = sanitizeManagedHtml(contentInput);
  const { error } = await supabase.from("pages").insert({
    title,
    title_en: title,
    url: slug,
    content: safeContent,
    content_en: safeContent,
    visibility,
    created_by: user.id,
  });

  if (error) redirect("/dashboard/pages?error=save_failed");
  revalidatePath("/");
  revalidatePath("/pages");
  revalidatePath(`/p/${slug}`);
  redirect("/dashboard/pages?created=1");
}

export async function updatePage(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = readText(formData, "id", 36);
  const title = readText(formData, "title", 180);
  const slug = readText(formData, "url", 100).toLowerCase();
  const contentInput = String(formData.get("content") ?? "");
  const visibility = readText(formData, "visibility", 20);

  if (!/^[0-9a-f-]{36}$/i.test(id) || !validatePage(title, slug, contentInput, visibility)) {
    redirect("/dashboard/pages?error=invalid");
  }

  const safeContent = sanitizeManagedHtml(contentInput);
  const { error } = await supabase.from("pages").update({
    title,
    title_en: title,
    url: slug,
    content: safeContent,
    content_en: safeContent,
    visibility,
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  if (error) redirect("/dashboard/pages?error=save_failed");
  revalidatePath("/");
  revalidatePath("/pages");
  revalidatePath(`/p/${slug}`);
  redirect("/dashboard/pages?updated=1");
}

export async function archivePage(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = readText(formData, "id", 36);
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/dashboard/pages?error=invalid");
  const { error } = await supabase.rpc("recycle_page", { p_page_id: id });
  if (error) redirect("/dashboard/pages?error=delete_failed");
  revalidatePath("/");
  revalidatePath("/pages");
  redirect("/dashboard/pages?recycled=1");
}

export async function restorePage(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = readText(formData, "id", 36);
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/dashboard/recycle-bin?error=invalid");
  const { error } = await supabase.rpc("restore_page", { p_recycle_id: id });
  if (error) redirect("/dashboard/recycle-bin?error=restore_failed");
  revalidatePath("/");
  revalidatePath("/pages");
  redirect("/dashboard/recycle-bin?restored=1");
}
