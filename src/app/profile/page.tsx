import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,bio,phone,avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  let safeAvatarUrl: string | null = null;
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (profile?.avatar_url && configuredUrl) {
    try {
      const avatar = new URL(profile.avatar_url);
      const project = new URL(configuredUrl);
      if (avatar.protocol === "https:" && avatar.hostname === project.hostname
        && avatar.pathname.startsWith("/storage/v1/object/public/profile-pictures/")) {
        safeAvatarUrl = avatar.toString();
      }
    } catch {
      safeAvatarUrl = null;
    }
  }

  const role = user.app_metadata?.role === "admin" ? "Admin" : "Member";
  return (
    <section>
      <p className="eyebrow">Community account</p>
      <h1>Profile</h1>
      <ProfileForm
        email={user.email ?? ""}
        role={role}
        fullName={profile?.full_name ?? ""}
        bio={profile?.bio ?? ""}
        phone={profile?.phone ?? ""}
        avatarUrl={safeAvatarUrl}
      />
    </section>
  );
}
