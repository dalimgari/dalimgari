const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..", "..");

test("React preview is isolated from the production page shell", () => {
  const preview = fs.readFileSync(path.join(root, "react-preview.html"), "utf8");
  const production = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(preview, /id="root"/);
  assert.match(preview, /src\/app\/main\.tsx/);
  assert.match(production, /id="site-header"/);
  assert.match(production, /id="main-content"/);
  assert.match(production, /id="site-footer"/);
});

test("browser Supabase configuration reads only public Vite variables", () => {
  const source = fs.readFileSync(path.join(root, "src/services/supabase.ts"), "utf8");
  assert.match(source, /VITE_SUPABASE_URL/);
  assert.match(source, /VITE_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(source, /service_role/i);
});
