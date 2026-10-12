const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("dashboard visibility is based on trusted app metadata, not editable user metadata", () => {
  const app = read("app.js");

  assert.match(app, /activeSession\.user\.app_metadata\.role/);
  assert.match(app, /currentUser\.app_metadata\.role/);
  assert.doesNotMatch(app, /user_metadata[\s\S]{0,100}?role/);
});

test("private content media is resolved through expiring signed URLs", () => {
  const app = read("app.js");

  assert.match(app, /async function createContentMediaUrl\(path\)/);
  assert.match(app, /storage\.from\("content-files"\)\.createSignedUrl\(path, 3600\)/);
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
