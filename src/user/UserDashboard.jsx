import "./UserDashboard.css";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import MediaInput from "../components/MediaInput";

export default function UserDashboard({ session, onBack }) {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, [session?.user?.id]);

  async function loadProfile() {
    if (!session?.user?.id) return;

    setError("");

    const { data, error: loadError } = await supabase
      .from("UserInformation")
      .select(
        "id, user_id, name, email, phone, address, date_of_birth, profile_photo_url, created_at"
      )
      .eq("user_id", session.user.id)
      .eq("record_type", "user")
      .maybeSingle();

    if (loadError) {
      setError(loadError.message);
      return;
    }

    setProfile(data);
    setName(data?.name || "");
    setPhone(data?.phone || "");
    setAddress(data?.address || "");
    setDateOfBirth(data?.date_of_birth || "");
    setAvatarUrl(data?.profile_photo_url || "");
  }

  async function saveProfile(event) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
      setSaving(false);
      return;
    }

    const { error: saveError } = await supabase
      .from("UserInformation")
      .update({
        name: name.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        date_of_birth: dateOfBirth || null,
        profile_photo_url: avatarUrl || null,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", session.user.id)
      .eq("record_type", "user");

    if (saveError) {
      setError(saveError.message);
    } else {
      setMessage("Profile updated successfully.");
      await loadProfile();
    }

    setSaving(false);
  }

  async function changePassword(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setChangingPassword(true);

    const { error: passwordError } =
      await supabase.auth.updateUser({
        password: newPassword
      });

    if (passwordError) {
      setError(passwordError.message);
    } else {
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password changed successfully.");
    }

    setChangingPassword(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="user-dashboard">
      <div className="container user-dashboard-container">
        <div className="user-dashboard-header">
          <p className="user-dashboard-eyebrow">My Account</p>
          <h1>User Dashboard</h1>
        </div>

        <section className="user-dashboard-card">
          <h2>Profile</h2>

          {avatarUrl && (
            <img
              className="user-dashboard-avatar"
              src={avatarUrl}
              alt="Profile"
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                objectFit: "cover"
              }}
            />
          )}

          <label>Profile Photo</label>

          <MediaInput
            value={avatarUrl}
            onChange={setAvatarUrl}
            folder={`avatars/${session.user.id}`}
            accept="image/*"
          />

          <form
            className="user-dashboard-form"
            onSubmit={saveProfile}
          >
            <label>
              Name
              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
              />
            </label>

            <label>
              Date of Birth
              <input
                type="date"
                value={dateOfBirth}
                onChange={(event) =>
                  setDateOfBirth(event.target.value)
                }
              />
            </label>

            <label>
              Address
              <input
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
              />
            </label>

            <label>
              Mobile Number
              <input
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={session.user.email || ""}
                readOnly
              />
            </label>

            <button
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </section>

        <section className="user-dashboard-card">
          <h2>Change Password</h2>

          <form
            className="user-dashboard-form"
            onSubmit={changePassword}
          >
            <label>
              New Password
              <input
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                autoComplete="new-password"
                minLength="6"
                required
              />
            </label>

            <label>
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                autoComplete="new-password"
                minLength="6"
                required
              />
            </label>

            <button
              type="submit"
              disabled={changingPassword}
            >
              {changingPassword
                ? "Changing..."
                : "Change Password"}
            </button>
          </form>
        </section>

        {message && (
          <p className="user-dashboard-message">
            {message}
          </p>
        )}

        {error && (
          <p className="user-dashboard-error">
            {error}
          </p>
        )}

        {profile?.created_at && (
          <p>
            Account created:{" "}
            {new Date(
              profile.created_at
            ).toLocaleDateString()}
          </p>
        )}

        <div className="user-dashboard-actions">
          <button
            type="button"
            className="user-dashboard-button"
            onClick={onBack}
          >
            Back to Website
          </button>

          <button
            type="button"
            className="user-dashboard-button"
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}
