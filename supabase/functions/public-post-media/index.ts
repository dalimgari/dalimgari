import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), { status: 405, headers: corsHeaders });
  }
  try {
    const body = await req.json();
    const postId = String(body?.post_id || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(postId)) {
      return new Response(JSON.stringify({ error: "Invalid post ID." }), { status: 400, headers: corsHeaders });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Media service is not configured." }), { status: 500, headers: corsHeaders });
    }
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: post, error: postError } = await admin
      .from("post").select("id,visibility,storage_path,media_url")
      .eq("id", postId).eq("visibility", "public").maybeSingle();
    if (postError) throw postError;
    if (!post) return new Response(JSON.stringify({ error: "Public post not found." }), { status: 404, headers: corsHeaders });
    const path = String(post.storage_path || (String(post.media_url || "").startsWith("posts/") ? post.media_url : ""));
    if (!path || !path.startsWith("posts/" + post.id + "/")) {
      return new Response(JSON.stringify({ error: "No uploaded media is available for this public post." }), { status: 404, headers: corsHeaders });
    }
    const { data: signed, error: signedError } = await admin.storage.from("site-media").createSignedUrl(path, 3600);
    if (signedError) throw signedError;
    return new Response(JSON.stringify({ url: signed.signedUrl, expires_in: 3600 }), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Public post media signing failed:", error);
    return new Response(JSON.stringify({ error: "Could not prepare public post media." }), { status: 500, headers: corsHeaders });
  }
});