"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function saveHomeWidgets(formData: FormData) {
  const { supabase } = await requireAdmin();
  const mapVisible = formData.get("mapVisible") === "on";
  const clockVisible = formData.get("clockVisible") === "on";
  const latitude = String(formData.get("latitude") ?? "").trim();
  const longitude = String(formData.get("longitude") ?? "").trim();
  const rawZoom = Number(formData.get("zoom") ?? 12);
  const zoom = Number.isInteger(rawZoom) ? rawZoom : 12;

  if (zoom < 1 || zoom > 20) redirect("/dashboard/widgets?error=invalid");
  if (mapVisible && (!latitude || !longitude)) redirect("/dashboard/widgets?error=coordinates");

  const { error } = await supabase.rpc("save_home_widgets", {
    p_map_visible: mapVisible,
    p_latitude: latitude,
    p_longitude: longitude,
    p_zoom: zoom,
    p_clock_visible: clockVisible,
  });
  if (error) redirect("/dashboard/widgets?error=save_failed");
  revalidatePath("/");
  revalidatePath("/map");
  redirect("/dashboard/widgets?saved=1");
}
