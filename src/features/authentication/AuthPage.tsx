import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";

type AuthMode = "login" | "create-account" | "forgot-password";

export function AuthPage({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(() => typeof window !== "undefined" && window.sessionStorage.getItem("dalimgari-password-recovery") === "true");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "info">("info");

  const title = mode === "login" ? "লগইন" : mode === "create-account" ? "নতুন অ্যাকাউন্ট" : recoveryMode ? "নতুন পাসওয়ার্ড সেট করুন" : "পাসওয়ার্ড পুনরুদ্ধার";

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
      setMessage("Supabase configuration পাওয়া যায়নি।");
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
        if (password.length < 12) throw new Error("পাসওয়ার্ড কমপক্ষে ১২ অক্ষরের হতে হবে।");
        if (password !== confirmPassword) throw new Error("দুটি পাসওয়ার্ড মেলেনি।");
        const { data: accessRow, error: accessError } = await supabase
          .from("site_customizations")
          .select("value")
          .eq("key", "ui_settings_users_access")
          .maybeSingle();
        if (accessError) throw new Error("অ্যাকাউন্ট তৈরির নীতি যাচাই করা যায়নি। পরে আবার চেষ্টা করুন।");
        let config = accessRow?.value;
        if (typeof config === "string") {
          try { config = JSON.parse(config) as typeof config; } catch { config = {}; }
        }
        if (config && typeof config === "object" && !Array.isArray(config) && "allow_account_creation" in config && config.allow_account_creation === false) {
          throw new Error("বর্তমানে নতুন অ্যাকাউন্ট তৈরি বন্ধ আছে।");
        }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: "https://dalimgari.github.io/dalimgari/#login" },
        });
        if (error) throw error;
        setMessageType("success");
        setMessage(data.session ? "অ্যাকাউন্ট তৈরি হয়েছে।" : "ইমেইল যাচাই করার জন্য আপনার ইনবক্স দেখুন।");
        return;
      }
      if (recoveryMode) {
        if (password.length < 12) throw new Error("পাসওয়ার্ড কমপক্ষে ১২ অক্ষরের হতে হবে।");
        if (password !== confirmPassword) throw new Error("দুটি পাসওয়ার্ড মেলেনি।");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        window.sessionStorage.removeItem("dalimgari-password-recovery");
        setRecoveryMode(false);
        setPassword("");
        setConfirmPassword("");
        setMessageType("success");
        setMessage("পাসওয়ার্ড পরিবর্তন হয়েছে। এখন লগইন করতে পারেন।");
        return;
      }
      const redirectTo = new URL("forgot-password.html", window.location.href).toString();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw error;
      setMessageType("success");
      setMessage("যদি এই ইমেইলটি নিবন্ধিত থাকে, পাসওয়ার্ড রিসেটের নির্দেশনা পাঠানো হবে।");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "অনুরোধ সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।");
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
            <label htmlFor="auth-email">ইমেইল</label>
            <input id="auth-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </>
        ) : null}
        {mode !== "forgot-password" || recoveryMode ? (
          <>
            <label htmlFor="auth-password">পাসওয়ার্ড</label>
            <input id="auth-password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "login" ? 1 : 12} value={password} onChange={(event) => setPassword(event.target.value)} />
          </>
        ) : null}
        {mode === "create-account" || (mode === "forgot-password" && recoveryMode) ? (
          <>
            <label htmlFor="auth-confirm-password">পাসওয়ার্ড নিশ্চিত করুন</label>
            <input id="auth-confirm-password" name="confirm-password" type="password" autoComplete="new-password" required minLength={12} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </>
        ) : null}
        <button type="submit" disabled={busy}>{busy ? "অপেক্ষা করুন…" : title}</button>
      </form>
      {message ? <p role={messageType === "error" ? "alert" : "status"} data-type={messageType}>{message}</p> : null}
      <nav className="auth-links" aria-label="অ্যাকাউন্টের লিংক">
        {mode !== "login" ? <Link to="/login">লগইন</Link> : null}
        {mode !== "create-account" ? <Link to="/create-account">অ্যাকাউন্ট তৈরি</Link> : null}
        {mode !== "forgot-password" ? <Link to="/forgot-password">পাসওয়ার্ড ভুলে গেছেন?</Link> : null}
      </nav>
    </section>
  );
}
