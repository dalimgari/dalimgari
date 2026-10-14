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
});
