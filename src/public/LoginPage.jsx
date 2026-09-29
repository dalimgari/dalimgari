import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "../App.css";

export default function LoginPage() {
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

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const { data } = await supabase.auth.getSession();

    if (!data.session) return;

    const { data: profile } = await supabase
      .from("UserInformation")
      .select("role, account_enabled")
      .eq("user_id", data.session.user.id)
      .eq("record_type", "user")
      .maybeSingle();

    if (profile?.account_enabled === false) {
      await supabase.auth.signOut();
      setError("This account is disabled.");
      return;
    }

    window.location.href =
      profile?.role === "admin"
        ? `${import.meta.env.BASE_URL}admin`
        : import.meta.env.BASE_URL;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    if (mode === "recovery") {
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
          .from("UserInformation")
          .insert({
            user_id: data.user.id,
            record_type: "user",
            name: name.trim(),
            email: email.trim(),
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
      setMode("signin");
      setName("");
      setPhone("");
      setEmail("");
      setDateOfBirth("");
      setAddress("");
      setPassword("");
      setSaving(false);
      return;
    }

    const { data, error: signinError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

    if (signinError) {
      setError(signinError.message);
      setSaving(false);
      return;
    }

    if (data.session) {
      const { data: profile } = await supabase
        .from("UserInformation")
        .select("role, account_enabled")
        .eq("user_id", data.session.user.id)
        .eq("record_type", "user")
        .maybeSingle();

      if (profile?.account_enabled === false) {
        await supabase.auth.signOut();
        setError("This account is disabled.");
        setSaving(false);
        return;
      }

      window.location.href =
        profile?.role === "admin"
          ? `${import.meta.env.BASE_URL}admin`
          : import.meta.env.BASE_URL;
    }

    setSaving(false);
  }

  const base = import.meta.env.BASE_URL;

  return (
    <div className="auth-page">
      <div className="auth-page-card">
        <a className="auth-page-back" href={base}>
          Back to Home
        </a>

        <h1>
          {mode === "recovery"
            ? "Reset Password"
            : mode === "signup"
              ? "Create Account"
              : "Login"}
        </h1>

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

          {mode !== "recovery" && (
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              minLength="6"
              required
            />
          )}

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}

          <button type="submit" disabled={saving}>
            {saving
              ? "Please wait..."
              : mode === "recovery"
                ? "Send Recovery Email"
                : mode === "signup"
                  ? "Create Account"
                  : "Login"}
          </button>
        </form>

        {mode === "signin" && (
          <button
            type="button"
            className="auth-link-button"
            onClick={() => {
              setMode("recovery");
              setError("");
              setMessage("");
            }}
          >
            Forgot password?
          </button>
        )}

        {mode === "recovery" ? (
          <button
            type="button"
            className="auth-link-button"
            onClick={() => {
              setMode("signin");
              setError("");
              setMessage("");
            }}
          >
            Back to Login
          </button>
        ) : (
          <button
            type="button"
            className="auth-link-button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
              setMessage("");
            }}
          >
            {mode === "signin"
              ? "Create a new account"
              : "Already have an account? Login"}
          </button>
        )}
      </div>
    </div>
  );
}
