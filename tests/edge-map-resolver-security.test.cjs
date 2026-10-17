const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "..", "supabase/functions/resolve-map-link/index.ts"),
  "utf8"
);

test("map resolver only permits HTTPS requests to an explicit Google Maps host allowlist", () => {
  assert.match(source, /url\.protocol !== "https:"/);
  assert.match(source, /url\.username \|\| url\.password/);
  assert.match(source, /url\.port && url\.port !== "443"/);
  assert.match(source, /const ALLOWED_HOSTS = new Set\(/);
  assert.match(source, /if \(!ALLOWED_HOSTS\.has\(host\)\) return false/);
  assert.match(source, /GOOGLE_MAPS_HOSTS\.has\(host\) && !url\.pathname\.startsWith\("\/maps"\)/);
});

test("map resolver manually validates each redirect before following it", () => {
  assert.match(source, /redirect: "manual"/);
  assert.match(source, /const MAX_REDIRECTS = 5/);
  assert.match(source, /if \(!isAllowedMapsUrl\(nextUrl\)\)/);
  assert.match(source, /currentUrl = nextUrl/);
});

test("map resolver bounds request time and response body size", () => {
  assert.match(source, /const FETCH_TIMEOUT_MS = 10_000/);
  assert.match(source, /AbortController\(\)/);
  assert.match(source, /const MAX_HTML_BYTES = 2_000_000/);
  assert.match(source, /if \(total > MAX_HTML_BYTES\)/);
});

test("map resolver only parses HTML responses and validates coordinate ranges", () => {
  assert.match(source, /contentType\.toLowerCase\(\)\.includes\("text\/html"\)/);
  assert.match(source, /lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180/);
  assert.match(source, /Number\(match\[1\]\) >= -90 && Number\(match\[1\]\) <= 90/);
  assert.match(source, /Number\(match\[2\]\) >= -180 && Number\(match\[2\]\) <= 180/);
});

test("map resolver accepts POST only and returns safe error responses", () => {
  assert.match(source, /if \(req\.method !== "POST"\)/);
  assert.match(source, /input\.length > 4096/);
  assert.match(source, /Could not resolve this Google Maps link/);
  assert.match(source, /"Cache-Control": "no-store"/);
});

test("map resolver restricts browser CORS to the production origin", () => {
  assert.match(source, /const ALLOWED_ORIGINS = new Set\(\["https:\/\/dalimgari\.github\.io"\]\)/);
  assert.match(source, /if \(origin && !ALLOWED_ORIGINS\.has\(origin\)\)/);
  assert.match(source, /"Vary": "Origin"/);
});
