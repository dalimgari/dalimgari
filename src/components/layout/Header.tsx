import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../services/supabase";

export function Header() {
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const syncUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setSignedIn(Boolean(data.user));
      setIsAdmin(String(data.user?.app_metadata?.role ?? "").toLowerCase() === "admin");
    };
    void syncUser();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setSignedIn(Boolean(session?.user));
      setIsAdmin(String(session?.user?.app_metadata?.role ?? "").toLowerCase() === "admin");
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="site-header" aria-label="Site header">
      <Link className="site-brand" to="/">
        Dalimgari
      </Link>
      <nav className="site-navigation" aria-label="Main navigation">
        <Link to="/">Home</Link>
        {signedIn ? <Link to="/profile">Profile</Link> : <Link to="/login">Login</Link>}
        {isAdmin ? <Link to="/dashboard">Dashboard</Link> : null}
      </nav>
      <span className="preview-label">React preview</span>
    </header>
  );
}
