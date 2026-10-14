const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("dashboard visibility is based on trusted app metadata, not editable user metadata", () => {
  const app = read("app.js");

  assert.match(app, /activeSession\.user\.app_metadata\.role/);
  assert.match(app, /currentUser\.app_metadata\.role/);
  assert.doesNotMatch(app, /user_metadata[\s\S]{0,100}?role/);
});

test("private content media is resolved through expiring signed URLs", () => {
  const app = read("app.js");

  assert.match(app, /async function createContentMediaUrl\(path, bucket = "content-files"\)/);
  assert.match(app, /storage\.from\(bucketId\)\.createSignedUrl\(normalizedPath, 3600\)/);
  assert.match(app, /return data\?\.signedUrl \|\| ""/);
  assert.doesNotMatch(app, /createContentMediaUrl\(path\)[\s\S]{0,500}?return path;/);
});

test("auth session changes update the menu and password recovery remains handled", () => {
  const app = read("app.js");

  assert.match(app, /supabaseClient\.auth\.onAuthStateChange\(\(event, session\)/);
  assert.match(app, /updateAuthMenu\(session\)/);
  assert.match(app, /event === "PASSWORD_RECOVERY"/);
  assert.match(app, /safeShowResetForm\(\)/);
});

test("homepage loading checks HTTP status and validates required sections before rendering", () => {
  const app = read("app.js");

  assert.match(app, /fetch\(new URL\("home\.html", window\.location\.href\), \{ credentials: "same-origin" \}\)/);
  assert.match(app, /if \(!response\.ok\) throw new Error\("home\.html returned HTTP "/);
  assert.match(app, /page\.querySelectorAll\("\.home-page-pillbar"\)\.length !== 1/);
  assert.match(app, /Could not load the homepage template:/);
});

test("content media resolves both legacy paths and Media Library storage fields with bounded parallelism", () => {
  const app = read("app.js");

  assert.match(app, /async function createContentMediaUrl\(path, bucket = "content-files"\)/);
  assert.match(app, /const path = item\.path \|\| item\.storage_path/);
  assert.match(app, /const bucket = item\.storage_bucket \|\| item\.bucket \|\| "content-files"/);
  assert.match(app, /const allowedContentMediaBuckets = new Set\(\["content-files", "hero-images", "profile-pictures"\]\)/);
  assert.match(app, /for \(let start = 0; start < media\.length; start \+= 6\)/);
  assert.match(app, /Promise\.all\(media\.slice\(start, start \+ 6\)/);
});

test("signed image URLs refresh once after a load error", () => {
  const app = read("app.js");

  assert.match(app, /function attachSignedImageRefresh\(image, path, bucket = "content-files"\)/);
  assert.match(app, /if \(refreshed \|\| !image\.isConnected\) return/);
  assert.match(app, /const freshUrl = await createContentMediaUrl\(path, bucket\)/);
  assert.match(app, /attachSignedImageRefresh\(mediaElement,\s*mediaPath,\s*mediaBucket\)/);
});

test("custom page HTML blocks control-character obfuscated executable URLs", () => {
  const app = read("app.js");
  const start = app.indexOf("function isUnsafePageUrl(value) {");
  const end = app.indexOf("\n    function sanitizePageHtml", start);
  assert.ok(start >= 0 && end > start, "URL sanitizer helper should exist before the HTML renderer");

  const helper = app.slice(start, end);
  const isUnsafePageUrl = vm.runInNewContext(helper + "; isUnsafePageUrl");

  assert.equal(isUnsafePageUrl("java\nscript:alert(1)"), true);
  assert.equal(isUnsafePageUrl("java\tscript:alert(1)"), true);
  assert.equal(isUnsafePageUrl("vbscript:alert(1)"), true);
  assert.equal(isUnsafePageUrl("data:text/html,<script>alert(1)</script>"), true);
  assert.equal(isUnsafePageUrl("data:image/svg+xml,<svg onload=alert(1)>"), true);
  assert.equal(isUnsafePageUrl("https://example.com/page"), false);
});
