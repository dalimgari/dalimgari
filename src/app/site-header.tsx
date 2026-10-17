"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function SiteHeader() {
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

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Dalimgari home">
        <span className="brand-mark" aria-hidden="true">D</span>
        <span>Dalimgari</span>
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/">Home</Link>
        <a href="/about">About</a>
        <a href="/pages">Pages</a>
        <a href="/privacy">Privacy</a>
        {user ? <a href="/profile">Profile</a> : <a href="/login">Login</a>}
        {isAdmin && <a href="/dashboard">Dashboard</a>}
        {user && <button className="nav-button" type="button" onClick={logout}>Logout</button>}
      </nav>
    </header>
  );
}
