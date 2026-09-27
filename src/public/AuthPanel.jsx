import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import UserDashboard from "./UserDashboard";

export default function AuthPanel() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);

      if (newSession) {
        loadRole(newSession);
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadSession() {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      setSession(data.session);
      await loadRole(data.session);
    }
  }

  async function loadRole(currentSession) {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", currentSession.user.id)
      .maybeSingle();

    setRole(data?.role || "user");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    if (mode === "signup") {
      const { data, error: signupError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password
        });

      if (signupError) {
        setError(signupError.message);
        setSaving(false);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            full_name: name.trim() || null,
            phone: phone.trim() || null
          });

        if (profileError) {
          setError(profileError.message);
          setSaving(false);
          return;
        }
      }

      setMessage(
        "Account created. Check your email if email confirmation is enabled."
      );
    } else {
      const { error: signinError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

      if (signinError) {
        setError("");
        setMode("signup");
        setMessage(
          "No matching account was found. You can create an account using this email and password."
        );
        setSaving(false);
        return;
      }
    }

    setSaving(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
    setOpen(false);
  }

  if (session) {
    if (role === "admin") {
      window.location.href = "/admin";
      return null;
    }

    if (open) {
      return (
        <div className="auth-overlay">
          <div className="auth-modal">
            <button
              type="button"
              onClick={() => setOpen(false)}
            >
              Close
            </button>

            <UserDashboard
              session={session}
              onBack={() => setOpen(false)}
            />
          </div>
        </div>
      );
    }

    return (
      <button
        type="button"
        className="login-button"
        onClick={() => setOpen(true)}
      >
        My Account
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        className="login-button"
        onClick={() => setOpen(true)}
      >
        Login
      </button>

      {open && (
        <div className="auth-overlay">
          <div className="auth-modal">
            <button
              type="button"
              onClick={() => setOpen(false)}
            >
              Close
            </button>

            <h2>
              {mode === "signin"
                ? "Login"
                : "Create Account"}
            </h2>

            {mode === "signup" && (
              <>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Name (optional)"
                />

                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Phone number (optional)"
                />
              </>
            )}

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                required
              />

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                minLength="6"
                required
              />

              <button type="submit" disabled={saving}>
                {saving
                  ? "Please wait..."
                  : mode === "signin"
                    ? "Login"
                    : "Create Account"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setMode(
                  mode === "signin"
                    ? "signup"
                    : "signin"
                );
                setError("");
                setMessage("");
              }}
            >
              {mode === "signin"
                ? "Create an account"
                : "Already have an account? Login"}
            </button>

            {message && <p>{message}</p>}
            {error && <p className="manager-error">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
