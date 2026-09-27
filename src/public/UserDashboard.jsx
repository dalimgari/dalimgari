import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function UserDashboard({ session, onBack }) {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      setError(error.message);
      return;
    }

    setProfile(data);
    setName(data?.full_name || "");
    setPhone(data?.phone || "");
  }

  async function saveProfile(event) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    const { error: saveError } = await supabase
      .from("profiles")
      .upsert({
        id: session.user.id,
        full_name: name.trim() || null,
        phone: phone.trim() || null,
        updated_at: new Date().toISOString()
      });

    if (saveError) {
      setError(saveError.message);
    } else {
      setMessage("Profile updated successfully.");
      await loadProfile();
    }

    setSaving(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="section">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">My Account</p>
          <h1>User Dashboard</h1>
          <p>{session.user.email}</p>
        </div>

        <form className="manager-form" onSubmit={saveProfile}>
          <label>
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
            />
          </label>

          <label>
            Phone
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Phone number"
            />
          </label>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>

          {message && <p className="manager-message">{message}</p>}
          {error && <p className="manager-error">{error}</p>}
        </form>

        <div className="hero-actions">
          <button type="button" className="button secondary" onClick={onBack}>
            Back to Website
          </button>

          <button type="button" className="button secondary" onClick={logout}>
            Sign Out
          </button>
        </div>

        {profile && (
          <p>
            Account created:{" "}
            {new Date(profile.created_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </main>
  );
}
