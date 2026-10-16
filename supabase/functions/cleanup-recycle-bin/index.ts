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

// Expired Recycle Bin records are purged only after candidate Storage paths are saved
// to a service-role-only queue. Objects are not removed until a later reference check.

const allowedStorageBuckets = new Set([
  "content-files",
  "media-library",
  "hero-images",
  "profile-pictures",
  "public-media-inbox",
  "site-media",
]);

function collectStorageObjects(item: Record<string, unknown>) {
  const objects = new Map<string, Set<string>>();
  const add = (bucket: string, path: string) => {
    const normalized = path.trim().replace(/^\/+/, "");
    if (!bucket || !normalized || normalized.split("/").some((part) => part === "." || part === "..") || /^https?:\/\//i.test(normalized)) return;
    if (!objects.has(bucket)) objects.set(bucket, new Set<string>());
    objects.get(bucket)!.add(normalized);
  };
  const scan = (value: unknown, inheritedBucket = ""): void => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const child of value) scan(child, inheritedBucket);
      return;
    }
    const record = value as Record<string, unknown>;
    const bucket = String(record.bucket_id || record.bucket || record.storage_bucket || inheritedBucket);
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

async function enqueueStorageObjects(item: Record<string, unknown>) {
  const objects = collectStorageObjects(item);
  const rows = Array.from(objects.entries()).flatMap(([bucket_id, paths]) =>
    Array.from(paths, (object_path) => ({ bucket_id, object_path })),
  );
  for (let offset = 0; offset < rows.length; offset += 500) {
    const { error } = await admin.from("storage_cleanup_queue").upsert(
      rows.slice(offset, offset + 500),
      { onConflict: "bucket_id,object_path", ignoreDuplicates: true },
    );
    if (error) throw new Error("Could not queue Storage paths: " + error.message);
  }
  return rows.length;
}

function collectStrings(value: unknown, target: string[]) {
  if (typeof value === "string") {
    target.push(value);
  } else if (Array.isArray(value)) {
    for (const child of value) collectStrings(child, target);
  } else if (value && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) collectStrings(child, target);
  }
}

async function loadLiveStorageReferences() {
  const tables = [
    "albums", "post", "pages", "hero_items", "media_assets",
    "profiles", "site_customizations", "site_settings", "recycle_bin",
  ] as const;
  const values: string[] = [];
  for (const table of tables) {
    let offset = 0;
    while (true) {
      const { data, error } = await admin.from(table).select("*").range(offset, offset + 499);
      if (error) throw new Error("Reference scan failed for " + table + ": " + error.message);
      for (const row of data || []) collectStrings(row, values);
      if (!data || data.length < 500) break;
      offset += 500;
    }
  }
  return values;
}

function isReferenced(path: string, values: string[]) {
  const normalized = path.replace(/^\/+/, "");
  let decoded = normalized;
  try { decoded = decodeURIComponent(normalized); } catch { /* Keep the original path for conservative matching. */ }
  return values.some((value) => {
    if (value.includes(normalized) || value.includes(decoded)) return true;
    try {
      const decodedValue = decodeURIComponent(value);
      return decodedValue.includes(normalized) || decodedValue.includes(decoded);
    } catch {
      return false;
    }
  });
}

async function processStorageQueue() {
  const { data: queued, error: queueError } = await admin.from("storage_cleanup_queue")
    .select("id,bucket_id,object_path,attempt_count")
    .order("created_at", { ascending: true })
    .limit(50);
  if (queueError) throw new Error("Could not load Storage cleanup queue: " + queueError.message);
  if (!queued || queued.length === 0) {
    return { processedStorageQueue: 0, removedFiles: 0, retainedReferencedFiles: 0, failedStorageQueue: 0 };
  }

  // If any source table cannot be scanned, abort before deleting any object.
  const liveValues = await loadLiveStorageReferences();
  let removedFiles = 0;
  let retainedReferencedFiles = 0;
  let failedStorageQueue = 0;

  for (const item of queued) {
    const attempt = {
      attempt_count: Number(item.attempt_count || 0) + 1,
      last_attempt_at: new Date().toISOString(),
    };
    if (!allowedStorageBuckets.has(item.bucket_id)) {
      failedStorageQueue++;
      await admin.from("storage_cleanup_queue").update({
        ...attempt, last_error: "Bucket is not on the approved cleanup allowlist",
      }).eq("id", item.id);
      continue;
    }
    if (isReferenced(item.object_path, liveValues)) {
      retainedReferencedFiles++;
      await admin.from("storage_cleanup_queue").update({
        ...attempt, last_error: "Object is still referenced by stored records",
      }).eq("id", item.id);
      continue;
    }

    const { error: removeError } = await admin.storage.from(item.bucket_id).remove([item.object_path]);
    if (removeError) {
      failedStorageQueue++;
      await admin.from("storage_cleanup_queue").update({
        ...attempt, last_error: removeError.message.slice(0, 1000),
      }).eq("id", item.id);
      continue;
    }
    const { error: queueDeleteError } = await admin.from("storage_cleanup_queue").delete().eq("id", item.id);
    if (queueDeleteError) {
      failedStorageQueue++;
      console.error("Storage object removed but queue row could not be deleted", item.id, queueDeleteError.message);
      continue;
    }
    removedFiles++;
  }

  return { processedStorageQueue: queued.length, removedFiles, retainedReferencedFiles, failedStorageQueue };
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
  let queuedFilesTotal = 0;
  let failedItems = 0;
  for (const item of expired || []) {
    try {
      const queuedFiles = await enqueueStorageObjects(item as Record<string, unknown>);
      const { error: deleteError } = await admin.from("recycle_bin").delete().eq("id", item.id);
      if (deleteError) throw deleteError;
      queuedFilesTotal += queuedFiles;
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

  let storageQueueResult: Awaited<ReturnType<typeof processStorageQueue>>;
  try {
    storageQueueResult = await processStorageQueue();
  } catch (queueError) {
    console.error("Storage cleanup queue processing was skipped", queueError instanceof Error ? queueError.message : String(queueError));
    storageQueueResult = { processedStorageQueue: 0, removedFiles: 0, retainedReferencedFiles: 0, failedStorageQueue: 1 };
  }

  return new Response(JSON.stringify({
    purgedItems,
    queuedFiles: queuedFilesTotal,
    purgedFiles: storageQueueResult.removedFiles,
    retainedReferencedFiles: storageQueueResult.retainedReferencedFiles,
    failedItems,
    ...storageQueueResult,
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
});
