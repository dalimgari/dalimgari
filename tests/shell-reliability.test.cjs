const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("shell layout requests stay same-origin and reject failed component responses", () => {
  const html = read("index.html");

  assert.match(html, /fetch\(new URL\("header\.html", document\.baseURI\), \{ credentials: "same-origin" \}\)/);
  assert.match(html, /fetch\(new URL\("footer\.html", document\.baseURI\), \{ credentials: "same-origin" \}\)/);
  assert.match(html, /if \(!headerResponse\.ok \|\| !footerResponse\.ok\)/);
  assert.match(html, /script\.onerror = \(\) => reject\(new Error\("Could not load required script: " \+ src\)\)/);
});

test("shell initialization failure is surfaced accessibly without injecting error HTML", () => {
  const html = read("index.html");

  assert.match(html, /catch \(error\)/);
  assert.match(html, /errorMessage\.setAttribute\("role", "alert"\)/);
  assert.match(html, /errorMessage\.textContent = "The page could not be initialized/);
  assert.match(html, /mainContent\.replaceChildren\(errorMessage\)/);
  assert.doesNotMatch(html, /mainContent\.innerHTML\s*=\s*["'`].*could not be initialized/i);
});

test("responsive app shell keeps viewport metadata and semantic page landmarks", () => {
  const html = read("index.html");

  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1\.0">/);
  assert.match(html, /<header\s+id="site-header"/);
  assert.match(html, /<main\s+id="main-content"/);
  assert.match(html, /<footer\s+id="site-footer"/);
});

test("home template keeps each dynamic section exactly once and allows narrow layouts", () => {
  const html = read("home.html");

  for (const section of [
    "home-hero",
    "home-page-pillbar",
    "home-page-title",
    "home-widget",
    "home-album",
    "home-page-card"
  ]) {
    const matches = html.match(new RegExp(section, "g")) || [];
    assert.equal(matches.length, 1, `Expected one ${section} section, found ${matches.length}`);
  }

  assert.match(html, /max-width:1200px/);
  assert.match(html, /min-width:0/);
  assert.match(html, /overflow-x:auto/);
  assert.match(html, /overscroll-behavior-x:contain/);
});
