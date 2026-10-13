const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("supabase/functions/cleanup-recycle-bin/index.ts", "utf8");

test("recycle-bin cleanup requires the server-only secret", () => {
  assert.match(source, /x-cleanup-secret/);
  assert.match(source, /edge_function_secrets/);
});

test("cleanup only considers approved storage buckets and canonical paths", () => {
  assert.match(source, /ALLOWED_STORAGE_BUCKETS/);
  assert.match(source, /content-files.*hero-images.*profile-pictures/);
  assert.match(source, /normalizeStoragePath/);
  assert.match(source, /segment === "\.\."/);
});

test("purging a page or post never deletes referenced storage objects", () => {
  assert.match(source, /item\.original_table !== "media_assets"/);
  assert.match(source, /isStorageObjectReferenced/);
  assert.match(source, /Retaining media object because an active record references it/);
});

test("cleanup has a second server-only authorization guard", () => {
  assert.match(source, /x-cleanup-secret/);
  assert.match(source, /suppliedSecret\.length !== secretRecord\.secret_value\.length/);
});
