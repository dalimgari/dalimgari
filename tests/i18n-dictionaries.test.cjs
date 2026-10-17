const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function readBilingualContentMigration() {
  const migrationDir = path.join(__dirname, "..", "supabase", "migrations");
  const candidates = fs.readdirSync(migrationDir).filter((name) =>
    /^\d+_add_bilingual_content_fields\.sql$/.test(name)
  );
  assert.equal(candidates.length, 1, "Expected one canonical bilingual content migration");
  return fs.readFileSync(path.join(migrationDir, candidates[0]), "utf8");
}

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
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8") + "\n" + fs.readFileSync(path.join(__dirname, "..", "dashboard.js"), "utf8");
  const migration = readBilingualContentMigration();
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
  const migration = readBilingualContentMigration();
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

test("header language control contains no adjacent language labels", () => {
  const header = fs.readFileSync(path.join(__dirname, "..", "header.html"), "utf8");
  assert.ok(header.includes('id="language-switcher"'));
  assert.ok(header.includes('aria-label="Switch language"'));
  assert.ok(header.includes('type="button" aria-label="Switch language"'));
  assert.ok(!header.includes("<select"));
  assert.ok(!header.includes("Language / ভাষা"));
  assert.ok(!header.includes("language-control-label"));
  assert.ok(!header.includes("language-section-label"));
  assert.ok(header.includes('id="theme-switcher"'), "Header should expose a day/night toggle beside the language control");
});

test("day/night mode toggles immediately and persists the visitor preference", () => {
  const headerScript = fs.readFileSync(path.join(__dirname, "..", "header.js"), "utf8");
  const headerStyles = fs.readFileSync(path.join(__dirname, "..", "header.css"), "utf8");
  assert.ok(headerScript.includes('localStorage.getItem(themeStorageKey)'));
  assert.ok(headerScript.includes('localStorage.setItem(themeStorageKey, nextMode)'));
  assert.ok(headerScript.includes('classList.toggle("dg-night-mode", isNight)'));
  assert.ok(headerStyles.includes("body.dg-night-mode"));
});

test("site identity and clock time follow the selected UI language while calendar dates stay bilingual", () => {
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8") + "\n" + fs.readFileSync(path.join(__dirname, "..", "dashboard.js"), "utf8");
  assert.ok(app.includes('name:"site_title_bn"'));
  assert.ok(app.includes('general.site_title_bn'));
  assert.ok(app.includes('new Intl.DateTimeFormat(locale,{hour:"2-digit"'));
  assert.ok(app.includes('hourCycle:"h12"'));
  assert.ok(app.includes('period=>period.toUpperCase()'));
  assert.ok(app.includes('hour%12||12'), "Bengali clock should use a 12-hour numeric display");
  assert.ok(app.includes('time.textContent=bengaliPeriod+" "+bengaliHour+":"+bengaliMinute;'));
  assert.ok(!app.includes('bengaliSecond'), "Digital clock must not display seconds");
  for (const period of ["সকাল","দুপুর","বিকেল","সন্ধ্যা","রাত"]) {
    assert.ok(app.includes('"' + period + '"'), "Missing Bengali clock period: " + period);
  }
  assert.ok(app.includes('new Intl.DateTimeFormat("en-GB",{timeZone:bangladeshTimeZone,weekday:"long",day:"numeric",month:"long",year:"numeric"})'), "Gregorian date should always use English weekday and month names");
  assert.ok(app.includes('["বৈশাখ","জ্যৈষ্ঠ","আষাঢ়"'));
  assert.ok(app.includes('const weekdayNames=["রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"]'), "Bengali calendar date should always use Bengali weekday names");
  assert.ok(app.includes('new Intl.NumberFormat("bn-BD",{useGrouping:false})'), "Bengali calendar date should always use Bengali digits");
  assert.ok(app.includes('date.textContent=gregorianPart("weekday")+", "+gregorianPart("day")+" "+gregorianPart("month")+", "+gregorianPart("year")'), "Gregorian date should use the fixed weekday, day month, year format");
  assert.ok(app.includes('banglaDate.textContent=weekdayNames[weekday]+", "+monthNames[banglaMonth]+" "+banglaDigitFormatter.format(remaining+1)+", "+banglaDigitFormatter.format(banglaYear)'), "Bengali date should use the fixed weekday, day month, year format");
  assert.ok(app.includes('new Intl.NumberFormat(getUiLanguage()==="bn"?"bn-BD":"en-GB"'));
  assert.ok(app.includes('document.addEventListener("dalimgari:languagechange",updateClock)'));
});

test("media titles and metadata follow the selected UI language across the site", () => {
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8") + "\n" + fs.readFileSync(path.join(__dirname, "..", "dashboard.js"), "utf8");
  assert.ok(app.includes("const localizedMediaValue ="), "Media labels should share the centralized localization helper");
  assert.ok(app.includes('const captionText=localizedMediaValue(item,"title")'), "Gallery captions should use the selected language");
  assert.ok(app.includes('mediaElement.textContent=localizedMediaValue(item,"title")'), "Non-previewable gallery files should use localized titles");
  assert.ok(app.includes('select("id,title,title_bn,title_en,original_filename,storage_bucket,storage_path,mime_type,size_bytes")'), "Media picker should fetch both title languages");
  assert.ok(app.includes('text.textContent=localizedMediaValue(asset,"title")'), "Media picker should display the localized title");
  assert.ok(app.includes('insert({title,title_en:titleEn,title_bn:titleBn,original_filename:file.name'), "Files uploaded from content editors should save both language titles");
  assert.ok(app.includes('option.textContent=localizedRecordValue(album,"title")'), "Album selectors should display the localized title");
});
