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

function collectStorageObjects(item: Record<string, unknown>) {
  const objects = new Map<string, Set<string>>();
  const add = (bucket: string, path: string) => {
    const normalized = path.trim().replace(/^\/+/, "");
    if (!normalized || /^https?:\/\//i.test(normalized)) return;
    if (!objects.has(bucket)) objects.set(bucket, new Set<string>());
    objects.get(bucket)!.add(normalized);
  };
  const scan = (value: unknown, defaultBucket = "content-files"): void => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const child of value) scan(child, defaultBucket);
      return;
    }
    const record = value as Record<string, unknown>;
    const bucket = String(record.bucket_id || record.bucket || record.storage_bucket || defaultBucket);
    for (const key of ["path", "file_path", "storage_path", "object_path", "cover_path"]) {
      if (typeof record[key] === "string") add(bucket, record[key] as string);
    }
    for (const child of Object.values(record)) {
      if (child && typeof child === "object") scan(child, bucket);
    }
  };
  scan(item.record_data);
  scan(item.related_data);
  return objects;
}

async function removeStoredObjects(item: Record<string, unknown>) {
  const objects = collectStorageObjects(item);
  let removed = 0;
  for (const [bucket, paths] of objects) {
    const items = Array.from(paths);
    for (let i = 0; i < items.length; i += 1000) {
      const chunk = items.slice(i, i + 1000);
      const { error } = await admin.storage.from(bucket).remove(chunk);
      if (error) throw new Error("Storage removal failed for " + bucket + ": " + error.message);
      removed += chunk.length;
    }
  }
  return removed;
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
