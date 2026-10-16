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
  const styles = read("site.css");

  for (const section of [
    "home-hero",
    "home-page-pillbar",
    "home-widget",
    "home-album",
    "home-page-card"
  ]) {
    const matches = html.match(new RegExp(section, "g")) || [];
    assert.equal(matches.length, 1, `Expected one ${section} section, found ${matches.length}`);
  }

  // Layout styles intentionally live in site.css rather than inline HTML styles.
  assert.match(styles, /\.home-page\s*\{[^}]*max-width:1200px/s);
  assert.match(styles, /\.home-page\s*\{[^}]*gap:var\(--dg-section-gap,24px\)/s, "all homepage sections should use the centralized section gap");
  assert.doesNotMatch(styles, /\.home-page\s*>\s*\.home-(?:widget|album|page-card)\s*\{[^}]*padding-bottom/s, "sections must not add local spacing on top of the global gap");
  assert.doesNotMatch(read("app.js"), /nav\.style\.cssText="[^"]*margin:0 0 22px/, "page pills must not add an extra local bottom margin");
  assert.match(styles, /\.home-page\s*>\s*\.home-section\s*\{[^}]*min-width:0/s);
  assert.match(styles, /\.home-page\s*\.home-page-pillbar\s*\{[^}]*overflow-x:auto/s);
  assert.match(styles, /\.home-page\s*\.home-page-pillbar\s*\{[^}]*overscroll-behavior-x:contain/s);
  assert.doesNotMatch(html, /\sstyle="/, "homepage layout should not use inline style attributes");
});

test("homepage starts hero loading early and gives the LCP image high priority", () => {
  const js = read("app.js");
  const includesStart = js.indexOf("const includeTargets = Object.entries(homeIncludes).map");
  const includesEnd = js.indexOf("// Public Pages appear as navigation pills", includesStart);
  assert.ok(includesStart >= 0 && includesEnd > includesStart);
  assert.match(js.slice(includesStart, includesEnd), /Promise\.all\(includeTargets\.map\(async/);
  assert.match(js.slice(includesStart, includesEnd), /Promise\.all\(includedPages\.filter\(Boolean\)\.map/);

  const renderHomeStart = js.indexOf("async function renderHome()");
  const heroStart = js.indexOf("const heroContentPromise = (async () =>", renderHomeStart);
  const heroRenderStart = js.indexOf("const heroRenderPromise = (async () =>", heroStart);
  const cardsStart = js.indexOf("const homepageCardsPromise = renderHomepageContentCards(siteConfig)", heroRenderStart);
  const includesRead = js.indexOf('.select("value").eq("key", "home_page_includes")', heroRenderStart);
  const heroAwait = js.indexOf("const heroRendered = await heroRenderPromise", cardsStart);
  assert.ok(renderHomeStart >= 0 && heroStart > renderHomeStart && heroRenderStart > heroStart &&
    cardsStart > heroRenderStart && includesRead > cardsStart && heroAwait > cardsStart,
    "hero rendering should start early, with card loading overlapping optional homepage reads");
  assert.match(js, /heroImagePreloader\.fetchPriority = "high"/);
  assert.match(js, /image\.fetchPriority = "high"/);
  assert.match(js, /await homepageCardsPromise/);
});
