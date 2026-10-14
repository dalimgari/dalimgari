const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("homepage section queries start concurrently and media URL requests are cached", () => {
  const app = read("app.js");
  const cards = app.indexOf("async function renderHomepageContentCards(siteConfig)");
  const queryGroup = app.indexOf("const widgetRowsPromise", cards);
  const firstSectionAwait = app.indexOf("await widgetRowsPromise", queryGroup);
  assert.ok(cards >= 0 && queryGroup > cards && firstSectionAwait > queryGroup);
  for (const promiseName of ["albumRowsPromise", "albumOrderPromise", "pageRowsPromise"]) {
    assert.ok(app.indexOf("const " + promiseName, queryGroup) < firstSectionAwait,
      promiseName + " should start before waiting for the widget query");
  }
  assert.match(app, /const contentMediaUrlCache = new Map\(\)/);
  assert.match(app, /const contentMediaUrlPending = new Map\(\)/);
  assert.match(app, /CONTENT_MEDIA_URL_CACHE_TTL_MS = 50 \* 60 \* 1000/);
});

test("homepage album covers use bounded concurrent URL generation and avoid unbounded image requests", () => {
  const app = read("app.js");
  assert.match(app, /async function mapWithConcurrency\(items, concurrency, mapper\)/);
  assert.match(app, /mapWithConcurrency\(coverRequests, 6/);
  assert.match(app, /\.slice\(0, 4\)/);
  assert.match(app, /const coverImages=coverImagesByAlbum\.get\(String\(album\.id\)\) \|\| \[\]/);
});

test("homepage animation timers stop after their owning elements are removed", () => {
  const app = read("app.js");
  assert.match(app, /if \(!pillBar\.isConnected\)\s*\{\s*stopPillAutoScroll\(\);/);
  assert.match(app, /const slideshowTimer=setInterval\(\(\)=>\{\s*if\(!cover\.isConnected\)\{clearInterval\(slideshowTimer\);return;\}/);
});

test("Pages artifact excludes project-only files and uploads staged public assets", () => {
  const workflow = read(".github/workflows/deploy.yml");
  assert.match(workflow, /mkdir -p _site/);
  assert.match(workflow, /--exclude='\/backup\/'/);
  assert.match(workflow, /--exclude='\/docs\/'/);
  assert.match(workflow, /--exclude='\/tests\/'/);
  assert.match(workflow, /--exclude='\/supabase\/'/);
  assert.match(workflow, /path: "_site"/);
  assert.doesNotMatch(workflow, /path: "\."/);
});
