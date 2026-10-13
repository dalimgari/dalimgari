import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { signOut } from "../../services/auth";
import { supabase } from "../../services/supabase";

interface ProfileData {
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  bio: string | null;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!supabase) {
        if (active) { setError("Supabase configuration পাওয়া যায়নি।"); setLoading(false); }
        return;
      }
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user) {
        navigate("/login", { replace: true });
        return;
      }
      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("full_name,phone,date_of_birth,bio")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!active) return;
      setUser(data.user);
      setProfile(profileRow ?? { full_name: null, phone: null, date_of_birth: null, bio: null });
      if (profileError) setError("প্রোফাইলের অতিরিক্ত তথ্য লোড করা যায়নি।");
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      setError("লগআউট সম্পন্ন হয়নি। আবার চেষ্টা করুন।");
    }
  };

  if (loading) return <p role="status">প্রোফাইল লোড হচ্ছে…</p>;
  if (!user) return <p role="alert">{error || "লগইন প্রয়োজন।"}</p>;

  return (
    <section className="profile-card" aria-labelledby="profile-title">
      <h1 id="profile-title">আমার প্রোফাইল</h1>
      <p>{profile?.full_name || user.user_metadata?.full_name || "নাম যোগ করা হয়নি"}</p>
      <p>{user.email}</p>
      <dl>
        <dt>ফোন</dt><dd>{profile?.phone || "যোগ করা হয়নি"}</dd>
        <dt>জন্মতারিখ</dt><dd>{profile?.date_of_birth || "যোগ করা হয়নি"}</dd>
        <dt>পরিচিতি</dt><dd>{profile?.bio || "যোগ করা হয়নি"}</dd>
        <dt>ভূমিকা</dt><dd>{String(user.app_metadata?.role || "member").toUpperCase()}</dd>
      </dl>
      {error ? <p role="alert">{error}</p> : null}
      <div className="profile-actions">
        <Link to="/profile/edit">প্রোফাইল সম্পাদনা</Link>
        <button type="button" onClick={() => void handleSignOut()}>লগআউট</button>
      </div>
    </section>
  );
}
