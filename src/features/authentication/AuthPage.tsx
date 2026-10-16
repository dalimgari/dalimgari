import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";

type AuthMode = "login" | "create-account" | "forgot-password";

export function AuthPage({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(
    () =>
      typeof window !== "undefined" &&
      window.sessionStorage.getItem("dalimgari-password-recovery") === "true",
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "info">("info");

  const title =
    mode === "login"
      ? "Login"
      : mode === "create-account"
        ? "Create account"
        : recoveryMode
          ? "Set a new password"
          : "Password recovery";

  useEffect(() => {
    if (mode !== "forgot-password" || !supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        window.sessionStorage.setItem("dalimgari-password-recovery", "true");
        setRecoveryMode(true);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [mode]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    if (!supabase) {
      setMessageType("error");
      setMessage("Supabase configuration is missing.");
      setBusy(false);
      return;
    }
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        navigate("/profile", { replace: true });
        return;
      }
      if (mode === "create-account") {
        if (password.length < 12) throw new Error("Password must be at least 12 characters long.");
        if (password !== confirmPassword) throw new Error("The passwords do not match.");
        const { data: accessRow, error: accessError } = await supabase
          .from("site_customizations")
          .select("value")
          .eq("key", "ui_settings_users_access")
          .maybeSingle();
        if (accessError)
          throw new Error("Could not verify account creation policy. Please try again later.");
        let config = accessRow?.value;
        if (typeof config === "string") {
          try {
            config = JSON.parse(config) as typeof config;
          } catch {
            config = {};
          }
        }
        if (
          config &&
          typeof config === "object" &&
          !Array.isArray(config) &&
          "allow_account_creation" in config &&
          config.allow_account_creation === false
        ) {
          throw new Error("বর্তমানে Create account তৈরি বন্ধ আছে।");
        }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: "https://dalimgari.github.io/dalimgari/#login" },
        });
        if (error) throw error;
        setMessageType("success");
        setMessage(
          data.session ? "Account created." : "Check your inbox to verify your email address.",
        );
        return;
      }
      if (recoveryMode) {
        if (password.length < 12) throw new Error("Password must be at least 12 characters long.");
        if (password !== confirmPassword) throw new Error("The passwords do not match.");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        window.sessionStorage.removeItem("dalimgari-password-recovery");
        setRecoveryMode(false);
        setPassword("");
        setConfirmPassword("");
        setMessageType("success");
        setMessage("Password পরিবর্তন হয়েছে। এখন Login করতে পারেন।");
        return;
      }
      const redirectTo = new URL("forgot-password.html", window.location.href).toString();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw error;
      setMessageType("success");
      setMessage("If this email is registered, password reset instructions will be sent.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error ? error.message : "The request could not be completed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <h1 id="auth-title">{title}</h1>
      <form onSubmit={(event) => void submit(event)}>
        {mode !== "forgot-password" || !recoveryMode ? (
          <>
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </>
        ) : null}
        {mode !== "forgot-password" || recoveryMode ? (
          <>
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={mode === "login" ? 1 : 12}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </>
        ) : null}
        {mode === "create-account" || (mode === "forgot-password" && recoveryMode) ? (
          <>
            <label htmlFor="auth-confirm-password">Password নিশ্চিত করুন</label>
            <input
              id="auth-confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </>
        ) : null}
        <button type="submit" disabled={busy}>
          {busy ? "Please wait…" : title}
        </button>
      </form>
      {message ? (
        <p role={messageType === "error" ? "alert" : "status"} data-type={messageType}>
          {message}
        </p>
      ) : null}
      <nav className="auth-links" aria-label="Account links">
        {mode !== "login" ? <Link to="/login">Login</Link> : null}
        {mode !== "create-account" ? <Link to="/create-account">Create account</Link> : null}
        {mode !== "forgot-password" ? (
          <Link to="/forgot-password">Password ভুলে গেছেন?</Link>
        ) : null}
      </nav>
    </section>
  );
}
