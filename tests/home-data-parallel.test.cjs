const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("homepage public-page data starts before optional included-page reads finish", () => {
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const renderHome = app.indexOf("async function renderHome()");
  const publicReads = app.indexOf("const publicPageConfigPromise = Promise.all([", renderHome);
  const includesRead = app.indexOf('.eq("key", "home_page_includes")', publicReads);
  const includedPageRender = app.indexOf("await Promise.all(includedPages.filter(Boolean).map", includesRead);
  const publicReadsAwait = app.indexOf("await publicPageConfigPromise", includedPageRender);
  assert.ok(renderHome >= 0 && publicReads > renderHome);
  assert.ok(includesRead > publicReads);
  assert.ok(includedPageRender > includesRead && publicReadsAwait > includedPageRender);
  assert.match(app.slice(publicReads, includesRead), /home_page_order/);
  assert.match(app.slice(publicReads, includesRead), /home_page_pill_autoscroll/);
});
