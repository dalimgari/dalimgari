const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("Recycle Bin delete and restore use admin-checked atomic database functions", () => {
  const migration = read("supabase/migrations/20261017100000_atomic_recycle_bin_and_safe_storage_cleanup.sql");
  const manager = read("src/features/dashboard/ContentManagerPage.tsx");
  const recycleBin = read("src/features/dashboard/RecycleBinPage.tsx");

  assert.match(migration, /create or replace function public\.move_to_recycle_bin/);
  assert.match(migration, /create or replace function public\.restore_from_recycle_bin/);
  assert.equal((migration.match(/security definer set search_path = ''/g) || []).length, 2);
  assert.equal((migration.match(/coalesce\(auth\.jwt\(\) -> 'app_metadata' ->> 'role', ''\) <> 'admin'/g) || []).length, 2);
  assert.match(migration, /p_table is null or p_table not in/);
  assert.match(migration, /for update/);
  assert.match(manager, /rpc\("move_to_recycle_bin"/);
  assert.match(recycleBin, /rpc\("restore_from_recycle_bin"/);
});

test("Recycle Bin snapshots role, permission, and album relations before deletion", () => {
  const migration = read("supabase/migrations/20261017100000_atomic_recycle_bin_and_safe_storage_cleanup.sql");
  assert.match(migration, /'user_roles'/);
  assert.match(migration, /'role_permissions'/);
  assert.match(migration, /'post'.*'pages'.*'hero_items'/s);
  assert.match(migration, /on conflict \(user_id\) do nothing/);
  assert.match(migration, /on conflict \(role_id, permission_id\) do nothing/);
});

test("expired-item cleanup queues Storage paths but never deletes objects without reference checks", () => {
  const cleanup = read("supabase/functions/cleanup-recycle-bin/index.ts");
  assert.ok(cleanup.includes("enqueueStorageObjects(item"));
  assert.ok(cleanup.indexOf("enqueueStorageObjects(item") < cleanup.indexOf('admin.from("recycle_bin").delete()'));
  assert.ok(cleanup.includes("storage_cleanup_queue"));
  assert.equal(cleanup.includes(".remove("), false);
});
