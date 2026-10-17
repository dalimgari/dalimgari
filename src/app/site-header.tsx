"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function SiteHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    let client: ReturnType<typeof createSupabaseBrowserClient>;
    try {
      client = createSupabaseBrowserClient();
    } catch {
      return;
    }

    client.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user);
    }).catch(() => {
      if (active) setUser(null);
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    try {
      await createSupabaseBrowserClient().auth.signOut();
    } finally {
      window.location.assign("/login");
    }
  }

  const isAdmin = user?.app_metadata?.role === "admin";
  const isHome = pathname === "/";
  const isProfile = pathname === "/profile";
  const isLogin = pathname === "/login";
  const isDashboard = pathname === "/dashboard";

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Dalimgari home">
        <span className="brand-mark" aria-hidden="true">D</span>
        <span>Dalimgari</span>
      </Link>
      <div className="site-header-actions">
        <nav aria-label="Main navigation">
          {!isHome && <Link href="/">Home</Link>}
          {!isProfile && <Link href="/profile">Profile</Link>}
          {user ? (
            <button className="nav-button" type="button" onClick={logout}>Logout</button>
          ) : (
            !isLogin && <Link href="/login">Login</Link>
          )}
        </nav>
        {isAdmin && !isDashboard && (
          <div className="site-header-admin">
            <Link href="/dashboard">Dashboard</Link>
          </div>
        )}
      </div>
    </header>
  );
}
