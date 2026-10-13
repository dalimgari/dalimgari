import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase server environment configuration");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_STORAGE_BUCKETS = new Set(["content-files", "hero-images", "profile-pictures"]);

function normalizeStoragePath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let path = value.trim();
  while (path.startsWith("/")) path = path.slice(1);
  if (!path || path.length > 1024 || path.toLowerCase().startsWith("http://") || path.toLowerCase().startsWith("https://")) return null;
  if (path.includes(String.fromCharCode(92))) return null;
  if (Array.from(path).some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  })) return null;
  const segments = path.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) return null;
  return path;
}

async function isStorageObjectReferenced(bucket: string, path: string, assetId: string): Promise<boolean> {
  const tables = [
    { name: "media_assets", columns: "id,storage_bucket,storage_path" },
    { name: "pages", columns: "id,content,media" },
    { name: "albums", columns: "id,cover_path,media" },
    { name: "hero_items", columns: "id,media" },
    { name: "post", columns: "id,content,media,custom_url" },
  ];

  for (const table of tables) {
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await admin.from(table.name).select(table.columns).range(offset, offset + 499);
      if (error) throw new Error("Could not verify media references in " + table.name + ": " + error.message);
      const rows = data || [];
      for (const row of rows as Array<Record<string, unknown>>) {
        if (table.name === "media_assets") {
          if (row.id === assetId) return true;
          if (row.storage_bucket === bucket && row.storage_path === path) return true;
        }
        const serialized = JSON.stringify(row);
        if (serialized.includes(path) || (assetId && serialized.includes(assetId))) return true;
      }
      if (rows.length < 500) break;
    }
  }
  return false;
}

async function removeStoredObjects(item: Record<string, unknown>) {
  // Storage objects belong to Media Library records, not every page/post that references them.
  if (item.original_table !== "media_assets") return 0;
  const record = item.record_data && typeof item.record_data === "object"
    ? item.record_data as Record<string, unknown>
    : {};
  const bucket = String(record.storage_bucket || "");
  const path = normalizeStoragePath(record.storage_path);
  const assetId = String(record.id || item.original_id || "");

  if (!ALLOWED_STORAGE_BUCKETS.has(bucket) || !path || !assetId) {
    throw new Error("Refusing to purge a media asset with an invalid bucket, path, or record ID.");
  }

  if (await isStorageObjectReferenced(bucket, path, assetId)) {
    console.info("Retaining media object because an active record references it", bucket, path);
    return 0;
  }

  const { error } = await admin.storage.from(bucket).remove([path]);
  if (error) throw new Error("Storage removal failed for " + bucket + ": " + error.message);
  return 1;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  // The gateway JWT check alone is insufficient because the project's anon key is public.
  // Require a second, server-only secret held in Vault and in a service-role-only table.
  const suppliedSecret = req.headers.get("x-cleanup-secret") || "";
  if (!suppliedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  const { data: secretRecord, error: secretError } = await admin
    .from("edge_function_secrets")
    .select("secret_value")
    .eq("name", "cleanup-recycle-bin")
    .maybeSingle();

  if (secretError || !secretRecord?.secret_value) {
    console.error("Cleanup authorization secret is not configured", secretError?.message || "");
    return new Response(JSON.stringify({ error: "Cleanup authorization is unavailable" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  if (suppliedSecret.length !== secretRecord.secret_value.length || suppliedSecret !== secretRecord.secret_value) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  const now = new Date().toISOString();
  const { data: expired, error } = await admin
    .from("recycle_bin")
    .select("id,original_table,record_data,related_data")
    .lte("purge_after", now)
    .order("purge_after", { ascending: true })
    .limit(500);

  if (error) {
    console.error("Could not load expired recycle bin items", error.message);
    return new Response(JSON.stringify({ error: "Could not load expired items" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  let purgedItems = 0;
  let purgedFiles = 0;
  let failedItems = 0;
  for (const item of expired || []) {
    try {
      purgedFiles += await removeStoredObjects(item as Record<string, unknown>);
      const { error: deleteError } = await admin.from("recycle_bin").delete().eq("id", item.id);
      if (deleteError) throw deleteError;
      purgedItems += 1;
    } catch (error) {
      failedItems += 1;
      console.error(
        "Recycle bin item retained because cleanup failed",
        item.id,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  return new Response(JSON.stringify({ purgedItems, purgedFiles, failedItems }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
});
