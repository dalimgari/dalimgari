const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const exists = (file) => fs.existsSync(path.join(__dirname, "..", file));

test("main entry keeps the independent header, content, and footer landmarks", () => {
  const html = read("index.html");
  assert.match(html, /<header\s+id="site-header"/);
  assert.match(html, /<main\s+id="main-content"/);
  assert.match(html, /<footer\s+id="site-footer"/);
  assert.match(html, /<html\s+lang="en"/i);
});

test("the app shell retains all required local layout assets", () => {
  const html = read("index.html");
  for (const asset of ["site.css", "header.css", "footer.css", "header.html", "footer.html", "app.js", "header.js"]) {
    assert.ok(exists(asset), `Missing required asset: ${asset}`);
    assert.ok(html.includes(asset), `index.html no longer references ${asset}`);
  }
});

test("the home template retains all configurable content sections", () => {
  const html = read("home.html");
  for (const section of ["home-hero", "home-page-pillbar", "home-page-title", "home-widget", "home-album", "home-page-card"]) {
    assert.ok(html.includes(section), `Missing homepage section: ${section}`);
  }
});

test("the current GitHub Pages deployment remains configured with limited permissions", () => {
  const workflow = read(".github/workflows/deploy.yml");
  assert.match(workflow, /branches:\s*\["main"\]/);
  assert.match(workflow, /contents:\s*read/);
  assert.match(workflow, /pages:\s*write/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /actions\/checkout@v4/);
  assert.match(workflow, /actions\/configure-pages@v5/);
  assert.match(workflow, /actions\/upload-pages-artifact@v3/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
});

test("database migration files are present and non-empty", () => {
  const dir = path.join(__dirname, "..", "supabase", "migrations");
  const migrations = fs.readdirSync(dir).filter((name) => name.endsWith(".sql"));
  assert.ok(migrations.length > 0, "No Supabase migrations found");
  for (const name of migrations) {
    assert.match(name, /^\d{14}_[a-z0-9_]+\.sql$/, `Unexpected migration filename: ${name}`);
    assert.ok(fs.statSync(path.join(dir, name)).size > 0, `Empty migration: ${name}`);
  }
});
