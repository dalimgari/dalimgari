const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("homepage hero rendering starts before optional homepage reads", () => {
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const heroData = app.indexOf("const heroContentPromise = (async () => {");
  const heroRender = app.indexOf("const heroRenderPromise = (async () => {", heroData);
  const includeRead = app.indexOf('.select("value").eq("key", "home_page_includes")', heroRender);
  const pagePillsRead = app.indexOf('select("id,title,title_bn,title_en,url,visibility,created_at")', includeRead);
  const appendHero = app.indexOf("heroSection.append(imageFrame);", heroRender);
  const awaitHeroRender = app.indexOf("const heroRendered = await heroRenderPromise;", pagePillsRead);

  assert.ok(heroData >= 0 && heroRender > heroData, "hero data loading must be established before hero rendering");
  assert.ok(appendHero > heroRender && appendHero < includeRead, "hero should be appended before optional includes are awaited");
  assert.ok(includeRead > heroRender && pagePillsRead > includeRead, "optional homepage reads should remain after hero rendering starts");
  assert.ok(awaitHeroRender > pagePillsRead, "existing homepage section setup should continue while hero rendering proceeds");
  assert.match(app, /image\\.fetchPriority = "high"/, "hero image should retain high fetch priority");
});
