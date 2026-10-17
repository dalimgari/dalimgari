import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export const metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  return (
    <section className="card">
      <p className="eyebrow">Signed-in account</p>
      <h1>Profile</h1>
      <p className="lead">You are signed in. This page currently displays only the account email.</p>
      <p><strong>Email:</strong> {user.email ?? "Unavailable"}</p>
      <form action={signOut}>
        <button className="button" type="submit">Sign out</button>
      </form>
    </section>
  );
}
