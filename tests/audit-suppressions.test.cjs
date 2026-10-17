const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const registry = JSON.parse(fs.readFileSync(path.join(root, ".audit-suppressions.json"), "utf8"));

test("leaked-password warning is permanently suppressed from project audit reports by exact rule ID", () => {
  const matches = registry.suppressions.filter((entry) =>
    entry.match?.source === "supabase-security-advisor" &&
    entry.match?.rule_id === "auth_leaked_password_protection"
  );

  assert.equal(matches.length, 1, "keep exactly one canonical suppression for this finding");
  assert.equal(matches[0].expires_at, null, "suppression must not expire");
  assert.equal(matches[0].scope, "reporting_only");
  assert.equal(matches[0].safety?.suppress_only_exact_rule_id, true);
  assert.equal(matches[0].safety?.suppress_other_security_findings, false);
  assert.equal(matches[0].safety?.change_supabase_auth_setting, false);
});

test("audit suppression policy requires registry filtering without claiming the security setting is fixed", () => {
  const policy = fs.readFileSync(path.join(root, "docs/AUDIT_SUPPRESSION_POLICY.md"), "utf8");
  assert.match(policy, /consult\s+`?\.audit-suppressions\.json`?/);
  assert.match(policy, /does not change the live Supabase Auth setting/);
  assert.match(policy, /Other security findings remain reportable/);
});
