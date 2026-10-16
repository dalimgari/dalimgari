const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const exists = (file) => fs.existsSync(path.join(__dirname, "..", file));

test("main entry keeps the independent header, content, and footer landmarks", () => {
  const html = read("index.html");
  assert.match(html, /<header\s+id="site-header"/);
  assert.match(html, /<main\s+id="main-content"/);
  assert.match(html, /<footer\s+id="site-footer"/);
  assert.match(html, /<html\s+lang="bn"/i);
  assert.match(html, /catch \(error\) \{[\s\S]*?dataset\.uiLanguageReady = "true"/,
    "initialization errors must reveal the shell so the visible alert is not hidden");
});

test("inline JavaScript in the HTML entry compiles before deployment", () => {
  const html = read("index.html");
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((match) => !/\bsrc\s*=/.test(match[1]));
  assert.ok(scripts.length > 0, "Expected inline bootstrap scripts in index.html");
  scripts.forEach((match, index) => {
    assert.doesNotThrow(
      () => new vm.Script(match[2], { filename: `index.html inline script ${index + 1}` }),
      `Invalid inline JavaScript in index.html script ${index + 1}`
    );
  });
});

test("the app shell retains all required local layout assets", () => {
  const html = read("index.html");
  for (const asset of ["site.css", "header.css", "footer.css", "header.html", "footer.html", "app.js", "header.js"]) {
    assert.ok(exists(asset), `Missing required asset: ${asset}`);
    assert.ok(html.includes(asset), `index.html no longer references ${asset}`);
  }
});

test("the home template contains only the requested sections in the requested order", () => {
  const html = read("home.html");
  const sections = ["home-hero", "home-page-pillbar", "home-album", "home-widget", "home-page-card"];
  for (const section of sections) assert.ok(html.includes(section), `Missing homepage section: ${section}`);
  assert.doesNotMatch(html, /home-page-title|aria-label="Page Title"/);
  const positions = sections.map((section) => html.indexOf(section));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b), "Homepage sections are out of order");
  const app = read("app.js");
  assert.doesNotMatch(app, /home-page-title/);
  assert.match(app, /defaultSectionOrder=\["hero","page_pills","album","widget","page_card"\]/);
  const dashboard = read("dashboard.js");
  assert.doesNotMatch(dashboard, /show_page_title|page_title:"Page Title"/);
  assert.match(dashboard, /page_pills:"Page Pill Button"/);
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

test("homepage template loading overlaps initial setup and site configuration is cached", () => {
  const app = read("app.js");
  assert.match(app, /let dalimgariSiteConfigCache = null;/);
  assert.match(app, /if \(!dalimgariSiteConfigPromise\)/);
  const renderHomeAt = app.indexOf("async function renderHome()");
  const templateStart = app.indexOf("const homeTemplatePromise =", renderHomeAt);
  const parallelSetupStart = app.indexOf("const [siteConfig, currentUser] = await Promise.all", renderHomeAt);
  assert.ok(renderHomeAt >= 0, "Homepage renderer was not found");
  assert.ok(templateStart > renderHomeAt && templateStart < parallelSetupStart,
    "Homepage template should start loading before initial setup is awaited");
  assert.ok(app.includes("const templateResult = await homeTemplatePromise;"));
  assert.ok(app.includes("if (force) {"), "Dashboard-triggered forced configuration refresh must remain available");
});

test("admin dashboard implementation is a deployed, on-demand asset", () => {
  const app = read("app.js");
  const dashboard = read("dashboard.js");
  assert.match(app, /new URL\("dashboard\.js", window\.location\.href\)/);
  assert.match(app, /window\.DalimgariDashboard\.renderDashboard\(\)/);
  assert.match(app, /getRuntimeConfig: \(\) => dalimgariRuntimeConfig/);
  assert.match(dashboard, /supabaseClient\.rpc\("get_my_permissions"\)/);
  assert.match(dashboard, /window\.DalimgariDashboard = \{ renderDashboard \}/);
  assert.doesNotMatch(app, /get_my_permissions/);
});


test("browser-delivered files never reference a Supabase service-role secret", () => {
  const browserFiles = ["index.html", "app.js", "header.js", "dashboard.js", "config.js"];
  for (const file of browserFiles) {
    const source = read(file);
    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|service_role_secret|sb_secret_[A-Za-z0-9_-]{16,}/i,
      `Privileged Supabase credentials must never be shipped to the browser: ${file}`);
  }
});

test("production deployment excludes source, tests, backups, and repository metadata", () => {
  const workflow = read(".github/workflows/deploy.yml");
  for (const excluded of ["/.git/", "/.github/", "/backup/", "/docs/", "/tests/", "/supabase/", "/node_modules/", "/_site/"]) {
    assert.ok(workflow.includes(`--exclude='${excluded}'`), `Production artifact must exclude ${excluded}`);
  }
  assert.match(workflow, /path:\s*"_site"/);
});

test("privileged Edge Functions enforce authorization and protect destructive operations", () => {
  const userManagement = read("supabase/functions/admin-user-management/index.ts");
  assert.match(userManagement, /auth\.getUser\(token\)/);
  assert.match(userManagement, /get_my_permissions/);
  assert.match(userManagement, /userId === SUPER_ADMIN_ID/);
  assert.match(userManagement, /Only the designated Super Admin/);

  const cleanup = read("supabase/functions/cleanup-recycle-bin/index.ts");
  assert.match(cleanup, /x-cleanup-secret/);
  assert.match(cleanup, /ALLOWED_STORAGE_BUCKETS/);
  assert.match(cleanup, /isStorageObjectReferenced/);
  assert.match(cleanup, /purge_after/);
});

test("map-link resolver rejects untrusted hosts and validates every redirect", () => {
  const resolver = read("supabase/functions/resolve-map-link/index.ts");
  assert.match(resolver, /const ALLOWED_HOSTS = new Set/);
  assert.match(resolver, /url\.protocol !== "https:"/);
  assert.match(resolver, /Validate every redirect destination BEFORE making the next request/);
  assert.match(resolver, /MAX_REDIRECTS/);
  assert.match(resolver, /FETCH_TIMEOUT_MS/);
});
