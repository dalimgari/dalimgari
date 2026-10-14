const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("translation observer batches added DOM roots and avoids repeated descendant scans", () => {
  const i18n = read("i18n/index.js");
  assert.match(i18n, /const pendingRoots = new Set\(\)/);
  assert.match(i18n, /const pendingTextNodes = new Set\(\)/);
  assert.match(i18n, /window\.requestAnimationFrame\(flushPendingTranslations\)/);
  assert.match(i18n, /other\.contains\(root\)/);
  assert.match(i18n, /translateTextNode\(node\)/);
});

test("media hardening batches mutation roots while retaining download deterrents", () => {
  const app = read("app.js");
  assert.match(app, /const pendingRoots = new Set\(\);\s*let hardeningScheduled = false/);
  assert.match(app, /window\.requestAnimationFrame\(flushMediaHardening\)/);
  assert.match(app, /controlslist", "nodownload noplaybackrate"/);
  assert.match(app, /media\.draggable = false/);
});

test("homepage reserves hero aspect ratio during its asynchronous fetch", () => {
  const app = read("app.js");
  const css = read("site.css");
  assert.match(app, /heroSection\.classList\.add\("is-loading"\)/);
  assert.match(app, /!el\.classList\.contains\("is-loading"\)/);
  assert.match(app, /heroSection\.classList\.remove\("is-loading"\)/);
  assert.match(css, /\.home-hero\.is-loading::before[\s\S]*?aspect-ratio:16\/9/);
});

test("production Lighthouse audit can run after a successful deployment", () => {
  const workflow = read(".github/workflows/performance-audit.yml");
  assert.match(workflow, /workflow_run:/);
  assert.match(workflow, /workflows: \["Deploy village website to GitHub Pages"\]/);
  assert.match(workflow, /github\.event\.workflow_run\.conclusion == 'success'/);
  assert.match(workflow, /Run three mobile Lighthouse measurements/);
  assert.match(workflow, /chrome-version: stable/);
  assert.match(workflow, /install-dependencies: true/);
  assert.match(workflow, /--headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu/);
});

test("gallery defers signed URL creation until tiles approach the viewport and paginates large sets", () => {
  const app = read("app.js");
  assert.match(app, /new IntersectionObserver\(entries =>/);
  assert.match(app, /rootMargin: "320px 0px"/);
  assert.match(app, /const batchSize=48/);
  assert.match(app, /const url=await createContentMediaUrl\(mediaPath,mediaBucket\)/);
  assert.match(app, /Load more \("/);
});

test("media library renders metadata cards in batches and requests only required columns", () => {
  const app = read("dashboard.js");
  assert.match(app, /const assetPageSize=24/);
  assert.match(app, /slice\(visibleAssetCount,visibleAssetCount\+assetPageSize\)/);
  assert.match(app, /select\("id,title,title_en,title_bn,description,description_en,description_bn,tags,tags_en,tags_bn,alt_text,alt_text_en,alt_text_bn,original_filename,storage_bucket,storage_path,mime_type,size_bytes,created_at,updated_at"\)/);
  assert.match(app, /createContentMediaUrl\(asset\.storage_path,asset\.storage_bucket\|\|"content-files"\)/);
});

test("homepage hero requests a responsive transformed image with an original-image fallback", () => {
  const app = read("app.js");
  assert.match(app, /async function createContentMediaUrl\(path, bucket = "content-files", transform = null\)/);
  assert.match(app, /createSignedUrl\(normalizedPath, 3600, \{ transform: normalizedTransform \}\)/);
  assert.match(app, /if \(result\.error && normalizedTransform[\s\S]*?createSignedUrl\(normalizedPath, 3600\)/);
  assert.match(app, /createContentMediaUrl\(firstImage\.path, "content-files", \{ width: 1200, quality: 75 \}\)/);
  assert.match(app, /avoid an extra await before the LCP request/);
});

test("dashboard code is split from the initial application bundle", () => {
  const app = read("app.js");
  const dashboard = read("dashboard.js");
  assert.ok(app.length < 200000, "initial app bundle should exclude the dashboard CRUD implementation");
  assert.match(app, /dashboardScriptPromise/);
  assert.match(app, /new URL\("dashboard\.js", window\.location\.href\)/);
  assert.match(dashboard, /async function renderDashboard\(\)/);
  assert.match(dashboard, /get_my_permissions/);
});
