const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function loadDictionary(file, globalName) {
  const context = { window: {} };
  const source = fs.readFileSync(path.join(__dirname, "..", "i18n", file), "utf8");
  vm.runInNewContext(source, context, { filename: file });
  return context.window[globalName];
}

test("Bengali and English dictionaries load and include core navigation", () => {
  const bn = loadDictionary("bn.js", "DG_I18N_BN");
  const en = loadDictionary("en.js", "DG_I18N_EN");
  for (const key of ["Home", "Gallery", "Profile", "Login", "Logout", "Dashboard", "Language"]) {
    assert.equal(typeof bn[key], "string", `Bengali translation missing: ${key}`);
    assert.equal(typeof en[key], "string", `English translation missing: ${key}`);
  }
  assert.equal(bn.Home, "হোম");
  assert.equal(en.Home, "Home");
});

test("Bengali dictionary includes key authentication and common action labels", () => {
  const bn = loadDictionary("bn.js", "DG_I18N_BN");
  for (const key of ["Email", "Password", "Save", "Cancel", "Delete", "Search", "Submit"]) {
    assert.ok(bn[key], `Expected Bengali translation for ${key}`);
  }
});

test("Bengali and English dictionaries have matching keys for every supported UI label", () => {
  const bn = loadDictionary("bn.js", "DG_I18N_BN");
  const en = loadDictionary("en.js", "DG_I18N_EN");
  assert.deepEqual(
    Object.keys(bn).sort(),
    Object.keys(en).sort(),
    "Every supported UI key must have both Bengali and English values"
  );
});

test("Dictionaries cover dashboard settings, account flows, and recovery actions", () => {
  const bn = loadDictionary("bn.js", "DG_I18N_BN");
  const en = loadDictionary("en.js", "DG_I18N_EN");
  const required = [
    "Site Identity",
    "Appearance & Theme",
    "Allow new account creation",
    "Permanently delete this item and its stored file, if any? This cannot be undone.",
    "Your admin session has expired. Please sign in again.",
    "Could not save role assignment:",
    "Change profile picture",
    "Email limit reached. Please try again after one hour.",
    "Homepage page order saved.",
    "Move this record to Recycle Bin? It can be restored within 30 days."
  ];
  for (const key of required) {
    assert.equal(typeof bn[key], "string", `Bengali translation missing: ${key}`);
    assert.equal(typeof en[key], "string", `English value missing: ${key}`);
  }
});

test("content editor and database migration support Bengali and English fields", () => {
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const migration = fs.readFileSync(path.join(__dirname, "..", "supabase", "migrations", "20261014090000_add_bilingual_content_fields.sql"), "utf8");
  for (const field of ["title_bn", "title_en", "description_bn", "description_en"]) {
    assert.ok(migration.includes("ADD COLUMN IF NOT EXISTS " + field), "Missing migration column: " + field);
  }
  for (const field of ["content_bn", "content_en", "caption_bn", "caption_en"]) {
    assert.ok(migration.includes("ADD COLUMN IF NOT EXISTS " + field), "Missing migration column: " + field);
  }
  assert.ok(app.includes('name:"title_bn"'));
  assert.ok(app.includes('name:"title_en"'));
  assert.ok(app.includes('name:"description_bn"'));
  assert.ok(app.includes('name:"description_en"'));
  assert.ok(app.includes('name:"content_bn"'));
  assert.ok(app.includes('name:"content_en"'));
  assert.ok(app.includes('const localizedRecordValue'));
  assert.ok(app.includes('Custom page HTML content is required in both Bengali and English.'));
  assert.ok(app.includes('title_bn:titleBn||null'));
  assert.ok(app.includes('title_en:titleEn||null'));
});

test("existing custom pages have English title, description, and HTML seed translations", () => {
  const migration = fs.readFileSync(path.join(__dirname, "..", "supabase", "migrations", "20261014090000_add_bilingual_content_fields.sql"), "utf8");
  for (const slug of [
    "population-occupation",
    "education-religious-institutions",
    "local-places",
    "village-overview",
    "history-naming",
    "geography-location",
    "agriculture-economy"
  ]) {
    assert.ok(migration.includes("WHERE url='" + slug + "'"), "Missing English seed for " + slug);
  }
});
