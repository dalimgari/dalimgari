const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("dashboard bilingual field pairs use the shared translation edge function", () => {
  const app = read("app.js");
  assert.match(app, /const bilingualBases=\[\.\.\.new Set\(config\.fields\.map/);
  assert.match(app, /supabaseClient\.functions\.invoke\("translate-bilingual"/);
  assert.match(app, /source_language:sourceName\.endsWith\("_bn"\)\?"bn":"en"/);
  assert.match(app, /target_language:targetName\.endsWith\("_bn"\)\?"bn":"en"/);
  assert.match(app, /await flushBilingualTranslations\(\)/);
});

test("auto-translation preserves administrator edits and avoids overwriting existing manual translations", () => {
  const app = read("app.js");
  assert.match(app, /const targetIsGenerated=bilingualGeneratedValues\.get\(targetName\)===targetValue/);
  assert.match(app, /if\(targetValue\.trim\(\)&&!targetIsGenerated\)return/);
  assert.match(app, /Never overwrite edits made while the network request was running/);
  assert.match(app, /targetInput\.value!==targetBefore\)return/);
});

test("translation edge function enforces administrator authorization and bounded bilingual requests", () => {
  const edge = read("supabase/functions/translate-bilingual/index.ts");
  assert.match(edge, /authClient\.auth\.getUser\(token\)/);
  assert.match(edge, /app_metadata\?\.role/);
  assert.match(edge, /text\.length > 30000/);
  assert.match(edge, /source === "bn" && target === "en"/);
  assert.match(edge, /general\/translation-llm/);
  assert.match(edge, /GOOGLE_CLOUD_TRANSLATE_API_KEY/);
});
