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
  avatar_url: string | null;
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
        if (active) {
          setError("Supabase configuration is missing.");
          setLoading(false);
        }
        return;
      }
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user) {
        navigate("/login", { replace: true });
        return;
      }
      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("full_name,phone,date_of_birth,bio,avatar_url")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!active) return;
      setUser(data.user);
      setProfile(
        profileRow ?? {
          full_name: null,
          phone: null,
          date_of_birth: null,
          bio: null,
          avatar_url: null,
        },
      );
      if (profileError) setError("Additional profile information could not be loaded.");
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      setError("Sign out failed. Please try again.");
    }
  };

  if (loading) return <p role="status">Loading profile…</p>;
  if (!user) return <p role="alert">{error || "Login required."}</p>;

  return (
    <section className="profile-card" aria-labelledby="profile-title">
      <h1 id="profile-title">My profile</h1>
      {profile?.avatar_url ? (
        <img className="profile-avatar-image" src={profile.avatar_url} alt="Profile photo" />
      ) : null}
      <p>{profile?.full_name || user.user_metadata?.full_name || "Name not provided"}</p>
      <p>{user.email}</p>
      <dl>
        <dt>Phone</dt>
        <dd>{profile?.phone || "Not provided"}</dd>
        <dt>Date of birth</dt>
        <dd>{profile?.date_of_birth || "Not provided"}</dd>
        <dt>Bio</dt>
        <dd>{profile?.bio || "Not provided"}</dd>
        <dt>Role</dt>
        <dd>{String(user.app_metadata?.role || "member").toUpperCase()}</dd>
      </dl>
      {error ? <p role="alert">{error}</p> : null}
      <div className="profile-actions">
        <Link to="/profile/edit">Edit profile</Link>
        <button type="button" onClick={() => void handleSignOut()}>
          Log out
        </button>
      </div>
    </section>
  );
}
