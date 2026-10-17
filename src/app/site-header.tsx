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
        <Link href="/about">About</Link>
        <Link href="/pages">Pages</Link>
        <Link href="/albums">Albums</Link>
        <Link href="/privacy">Privacy</Link>
        {user ? <Link href="/profile">Profile</Link> : <><Link href="/login">Login</Link><Link href="/signup">Sign up</Link></>}
        {isAdmin && <Link href="/dashboard">Dashboard</Link>}
        {user && <button className="nav-button" type="button" onClick={logout}>Logout</button>}
      </nav>
    </header>
  );
}
