import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import UserDashboard from "../user/UserDashboard";

export default function AuthPanel({ onClose }) {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [recovery, setRecovery] = useState(false);

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
      .from("UserInformation")
      .select("role, account_enabled")
      .eq("user_id", currentSession.user.id)
      .eq("record_type", "user")
      .maybeSingle();

    if (!data) {
      setRole("user");
      return;
    }

    if (data.account_enabled === false) {
      await supabase.auth.signOut();
      setSession(null);
      setRole(null);
      setError("This account is disabled.");
      return;
    }

    setRole(data.role || "user");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    if (recovery) {
      if (!email.trim()) {
        setError("Email is required for password recovery.");
        setSaving(false);
        return;
      }

      const { error: recoveryError } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`
        });

      if (recoveryError) {
        setError(recoveryError.message);
      } else {
        setMessage("Password recovery email sent.");
      }

      setSaving(false);
      return;
    }

    if (mode === "signup") {
      if (!name.trim()) {
        setError("Name is required.");
        setSaving(false);
        return;
      }

      if (!email.trim() && !phone.trim()) {
        setError("Mobile number or email is required.");
        setSaving(false);
        return;
      }

      if (!email.trim()) {
        setError(
          "Email is required for this signup method. Phone-only signup requires phone authentication to be enabled."
        );
        setSaving(false);
        return;
      }

      const { data, error: signupError } = await supabase.auth.signUp({
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
          .from("UserInformation")
          .insert({
            user_id: data.user.id,
            record_type: "user",
            name: name.trim(),
            email: email.trim() || null,
            phone: phone.trim() || null,
            address: address.trim() || null,
            date_of_birth: dateOfBirth || null,
            role: "user",
            account_enabled: true
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

      setName("");
      setPhone("");
      setEmail("");
      setDateOfBirth("");
      setAddress("");
      setPassword("");
    } else {
      const { error: signinError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

      if (signinError) {
        setError(signinError.message);
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

    if (onClose) {
      onClose();
    }
  }

  function closePanel() {
    setOpen(false);

    if (onClose) {
      onClose();
    }
  }

  if (session) {
    if (role === "admin") {
      window.location.href = `${import.meta.env.BASE_URL}admin`;
      return null;
    }

    return (
      <UserDashboard
        session={session}
        onBack={() => {
          setSession(null);
          setRole(null);
          setOpen(false);

          if (onClose) {
            onClose();
          }
        }}
      />
    );
  }

  return (
    <>
      {!open && (
        <button type="button" onClick={() => setOpen(true)}>
          Login
        </button>
      )}

      {open && (
        <div className="auth-panel">
          <div className="auth-panel-inner">
            <button
              type="button"
              onClick={closePanel}
              aria-label="Close"
            >
              ×
            </button>

            <h2>
              {recovery
                ? "Reset Password"
                : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </h2>

            <form onSubmit={handleSubmit}>
              {mode === "signup" && (
                <>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Name"
                    required
                  />

                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(event) =>
                      setDateOfBirth(event.target.value)
                    }
                    placeholder="Date of Birth"
                  />

                  <input
                    type="text"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="Address"
                  />

                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Mobile Number"
                  />
                </>
              )}

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

              {error && <p>{error}</p>}
              {message && <p>{message}</p>}

              <button type="submit" disabled={saving}>
                {saving
                  ? "Please wait..."
                  : recovery
                    ? "Send Recovery Email"
                    : mode === "signin"
                      ? "Sign In"
                      : "Create Account"}
              </button>
            </form>

            {mode === "signin" && !recovery && (
              <button
                type="button"
                onClick={() => {
                  setRecovery(true);
                  setError("");
                  setMessage("");
                }}
              >
                Forgot password?
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setRecovery(false);
                setMode(mode === "signin" ? "signup" : "signin");
                setError("");
                setMessage("");
              }}
            >
              {mode === "signin"
                ? "Create a new account"
                : "Already have an account? Sign in"}
            </button>

            {session && (
              <button type="button" onClick={logout}>
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
