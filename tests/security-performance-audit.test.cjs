const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const resolver = fs.readFileSync(path.join(root, "supabase/functions/resolve-map-link/index.ts"), "utf8");
const duplicateTriggerMigration = fs.readFileSync(
  path.join(root, "supabase/migrations/20261013184928_remove_duplicate_profile_insert_trigger.sql"),
  "utf8"
);

test("map resolver does not grant wildcard browser CORS access", () => {
  assert.match(resolver, /const ALLOWED_ORIGINS = new Set\(\["https:\/\/dalimgari\.github\.io"\]\)/);
  assert.doesNotMatch(resolver, /Access-Control-Allow-Origin["']?\s*:\s*["']\*["']/);
  assert.match(resolver, /if \(origin && !ALLOWED_ORIGINS\.has\(origin\)\)/);
  assert.match(resolver, /headers\["Access-Control-Allow-Origin"\] = origin/);
});

test("map resolver keeps redirect and URL validation in place", () => {
  assert.match(resolver, /redirect:\s*"manual"/);
  assert.match(resolver, /isAllowedMapsUrl\(nextUrl\)/);
  assert.match(resolver, /MAX_REDIRECTS/);
  assert.match(resolver, /MAX_HTML_BYTES/);
});

test("homepage section reads start before optional page-include waits", () => {
  const startCards = app.indexOf("const homepageCardsPromise = renderHomepageContentCards(siteConfig)");
  const waitForIncludeConfig = app.indexOf("const { data: includeConfigRow } = await includeConfigPromise");
  const renderIncludedHtml = app.indexOf("renderHtmlInto(target, content, null)");
  const awaitCardsBeforeIncludes = app.indexOf("await homepageCardsPromise;", waitForIncludeConfig);
  assert.notEqual(startCards, -1, "homepage card loading must start");
  assert.notEqual(waitForIncludeConfig, -1, "include configuration must be loaded");
  assert.notEqual(renderIncludedHtml, -1, "included HTML rendering must remain present");
  assert.ok(startCards < waitForIncludeConfig, "section reads must start before awaiting include configuration");
  assert.ok(awaitCardsBeforeIncludes !== -1 && awaitCardsBeforeIncludes < renderIncludedHtml,
    "included HTML must wait for card rendering to avoid a DOM write race");
  assert.equal((app.match(/const homepageCardsPromise = renderHomepageContentCards\(siteConfig\)/g) || []).length, 1);
});

test("profile trigger cleanup migration is idempotent and retains canonical trigger", () => {
  assert.match(duplicateTriggerMigration, /DROP TRIGGER IF EXISTS sync_auth_user_profile_after_insert ON auth\.users/i);
  assert.match(duplicateTriggerMigration, /canonical trigger remains/i);
});
