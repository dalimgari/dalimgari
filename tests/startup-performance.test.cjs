const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("shell loads independent startup resources in parallel before dependent initialization", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const resourceStart = html.indexOf("const startupResourcesPromise = Promise.all([");
  const resourceEnd = html.indexOf("]);", resourceStart);
  const sdkReady = html.indexOf("await Promise.all([supabaseSdkPromise, startupResourcesPromise])");
  assert.ok(resourceStart >= 0 && resourceEnd > resourceStart && sdkReady > resourceEnd,
    "independent startup resources should load while the SDK is in flight");

  const parallelBlock = html.slice(resourceStart, resourceEnd);
  for (const resource of ['loadScript("i18n/bn.js")', 'loadScript("i18n/en.js")', 'loadScript("config.js")']) {
    assert.ok(parallelBlock.includes(resource), `${resource} should be in the parallel startup group`);
  }

  const translationRegistry = html.indexOf('await loadScript("i18n/index.js")', parallelEnd);
  const app = html.indexOf('await loadScript("app.js")', translationRegistry);
  const header = html.indexOf('await loadScript("header.js")', app);
  assert.ok(translationRegistry > parallelEnd, "translation registry must wait for language dictionaries");
  assert.ok(app > translationRegistry, "app must wait for config and translation registry");
  assert.ok(header > app, "header initialization must retain its app dependency");
});

test("startup optimization preserves the Supabase SDK and layout prerequisites", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.match(html, /const supabaseSdkPromise = loadScript\("https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2"\)/);
  assert.match(html, /const \[headerResponse, footerResponse\] = await Promise\.all\(/);
  assert.match(html, /await Promise\.all\(\[supabaseSdkPromise, startupResourcesPromise\]\)/);
  assert.match(html, /headerHost\.innerHTML = headerMarkup/);
  assert.match(html, /footerHost\.innerHTML = footerMarkup/);
});
