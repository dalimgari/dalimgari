import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function PostInteractions({ postId }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();

      if (active) {
        setSession(data.session || null);
        setLoading(false);
      }
    }

    loadSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (active) {
        setSession(currentSession || null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [postId]);

  if (loading) {
    return <small>Loading...</small>;
  }

  return (
    <div className="post-interactions">
      {session?.user ? (
        <small>Signed in</small>
      ) : (
        <small>Sign in to interact with this post.</small>
      )}
    </div>
  );
}
