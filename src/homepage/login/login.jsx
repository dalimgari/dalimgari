import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseclient";
import "./login.css";

export default function Login() {
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
    await redirectUser(data.session.user.id);
  }

  async function redirectUser(userId) {
    const { data: profile } = await supabase
      .from("UserInformation")
      .select("role, account_enabled")
      .eq("user_id", userId)
      .eq("record_type", "user")
      .maybeSingle();

    if (profile?.account_enabled === false) {
      await supabase.auth.signOut();
      setError("This account is disabled.");
      return;
    }

    const base = import.meta.env.BASE_URL;

    window.location.href =
      profile?.role === "admin" ? `${base}admin` : base;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    if (mode === "recovery") {
      if (!email.trim()) {
        setError("Email is required.");
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

      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setSaving(false);
        return;
      }

      const signupData = email.trim()
        ? { email: email.trim(), password }
        : { phone: phone.trim(), password };

      const { data, error: signupError } =
        await supabase.auth.signUp(signupData);

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
        "Account created. Check your verification message if required."
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

    if (!email.trim() && !phone.trim()) {
      setError("Mobile number or email is required.");
      setSaving(false);
      return;
    }

    const signinData = email.trim()
      ? { email: email.trim(), password }
      : { phone: phone.trim(), password };

    const { data, error: signinError } =
      await supabase.auth.signInWithPassword(signinData);

    if (signinError) {
      setError(signinError.message);
      setSaving(false);
      return;
    }

    if (data.session) {
      await redirectUser(data.session.user.id);
    }

    setSaving(false);
  }

  const base = import.meta.env.BASE_URL;

  return (
    <main className="login-page">
      <section className="login-card">
        <a className="login-back" href={base}>
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
                onChange={(event) => setDateOfBirth(event.target.value)}
              />

              <input
                type="text"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Address"
              />
            </>
          )}

          {mode !== "recovery" && (
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Mobile Number"
            />
          )}

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
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

          {error && <p className="login-error">{error}</p>}
          {message && <p className="login-message">{message}</p>}

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
            className="login-link"
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
            className="login-link"
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
            className="login-link"
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
      </section>
    </main>
  );
}
