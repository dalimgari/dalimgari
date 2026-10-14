const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const mimeSet = (source) => [...source.matchAll(/['"]([^'"]+\/[^'"]+)['"]/g)].map((match) => match[1]).sort();

test("Media Library upload MIME types match the Storage bucket allowlist", () => {
  const app = read("app.js") + "\n" + read("dashboard.js");
  const migration = read("supabase/migrations/20261010213728_minimal_dashboard_content_system.sql");
  const libraryBlock = app.match(/const allowedUploadTypes=new Set\(\[([\s\S]*?)\]\);/);
  const contentBlock = app.match(/const allowedTypes=new Set\(\[([\s\S]*?)\]\);/);
  const bucketBlock = migration.match(/values \('content-files','content-files',false,52428800,array\[([\s\S]*?)\]\)/);

  assert.ok(libraryBlock, "Media Library upload allowlist should exist");
  assert.ok(contentBlock, "Content editor upload allowlist should exist");
  assert.ok(bucketBlock, "content-files bucket should declare its MIME allowlist and 50 MiB limit");

  const bucketTypes = mimeSet(bucketBlock[1]);
  assert.deepEqual(mimeSet(libraryBlock[1]), bucketTypes, "Media Library types must match the bucket");
  assert.deepEqual(mimeSet(contentBlock[1]), bucketTypes, "Content editor types must match the bucket");
});

test("Client upload size validation matches the 50 MiB Storage limit", () => {
  const app = read("app.js") + "\n" + read("dashboard.js");
  const migration = read("supabase/migrations/20261010213728_minimal_dashboard_content_system.sql");

  assert.match(app, /file\.size>50\*1024\*1024/);
  assert.match(app, /file\.size>50\s*\*\s*1024\s*\*\s*1024/);
  assert.match(migration, /values \('content-files','content-files',false,52428800,array\[/);
  assert.equal(50 * 1024 * 1024, 52428800);
});
