# Remediation Runbook — 2026-10-13

This runbook distinguishes repository changes that can be automated from production actions that require the Supabase Dashboard or additional runtime evidence. The live database has not been modified by this runbook.

## 1. P0 — Enable leaked-password protection

The latest Supabase Security Advisor reports `auth_leaked_password_protection` as disabled. The connected project tooling does not expose an Auth setting mutation, so this cannot be safely enabled through the available database tools.

1. Open the [Supabase project dashboard](https://supabase.com/dashboard/project/yopfogoyjxwxplnabqii/auth/providers?provider=Email).
2. Open the Email/password or Password Security settings.
3. Enable leaked-password protection (Supabase checks candidate passwords against the Have I Been Pwned Pwned Passwords service).
4. Save the setting.
5. Re-run the project's Security Advisor. Completion criteria: `auth_leaked_password_protection` no longer appears as a warning.
6. Test new signup and password change using a test account and a known compromised test password; never test with a real user's password.

Availability may depend on the Supabase plan. If the control is unavailable, record the plan limitation rather than treating the setting as enabled.

Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## 2. P1 — Measure the live homepage before further optimization

A manual GitHub Actions workflow, **Production performance audit**, runs three mobile Lighthouse measurements against the public homepage and stores JSON/HTML reports as a 14-day artifact.

1. Open the repository's Actions tab.
2. Select **Production performance audit**.
3. Choose **Run workflow** and wait for completion.
4. Download the `dalimgari-lighthouse-mobile-<run-number>` artifact.
5. Compare FCP, LCP, TBT, CLS, Speed Index, and performance score across the three runs. Treat one-off outliers cautiously.
6. Inspect the Lighthouse waterfall and the browser Network panel for `index.html`, `home.html`, `app.js`, Supabase API requests, and media files before making more code changes.

This measures the deployed public page under Lighthouse's simulated mobile profile. It does not authenticate, exercise dashboard write operations, or replace tests on a real low-end Android device. Do not claim a speed improvement until comparable before/after reports exist.

## 3. P1 — Authentication, permissions, Storage, and Edge Functions

Use a non-production test account and representative public/private media:

- Sign in, sign out, expired/invalid session, and password recovery.
- Confirm public pages/media remain readable only where intended.
- Confirm private `content-files` objects require an authorized signed URL and that expired URLs stop working.
- Verify users without content permissions cannot create, edit, or delete protected rows.
- Verify dashboard users with the required permission can still perform their intended operations.
- Test `resolve-map-link` with a valid Google Maps link, an unapproved host, a redirect to an unapproved host, malformed input, and timeout/oversized responses.
- Test recycle-bin cleanup only in a staging environment; verify it cannot be invoked by an ordinary user.

The existing Node tests are source-level regression checks, not full end-to-end tests. Record actual browser/API results separately.

## 4. P1 — Migration history and production schema

Production has 45 migration ledger entries; the repository contains 24 migration files, and exact-name matching is incomplete. Live schema also differs from some historical SQL files.

- Do not run `supabase db push`, replay unmatched migrations, run migration repair, or edit the migration ledger just to make filenames match.
- Recover the original SQL and deployment order for unmatched production entries.
- Compare each migration's intended schema/policies with the current catalog and data.
- Rehearse any reconciliation on a staging clone, then review a forward-only migration.
- Preserve the existing permission-based RLS and Storage model; do not apply historical migrations that add anonymous upload access or broad admin grants.

## 5. P2 — Indexes and duplicate profile trigger

The Performance Advisor flags 14 indexes as unused, but the database reports `pg_stat_database.stats_reset = NULL`; therefore, a zero scan count is not sufficient evidence to remove an index. Keep them until workload and query plans are measured, and test candidate removals on staging.

Two `AFTER INSERT` triggers on `auth.users` call `public.sync_auth_user_profile()`. The function uses `ON CONFLICT (id) DO NOTHING`, so the second insert trigger appears redundant, but do not drop either trigger directly. Recover migration history, verify function behavior and dependencies, then remove one only through a reviewed, forward-only migration.

## 6. Verification and completion criteria

- [ ] Security Advisor no longer warns about leaked-password protection.
- [ ] Three-run Lighthouse artifact is captured and reviewed; a baseline and post-change comparison exists for any claimed optimization.
- [ ] Authentication and permission tests pass using test accounts.
- [ ] Public/private Storage access is verified without weakening RLS.
- [ ] Edge Function behavior is tested end-to-end, not only by source regex tests.
- [ ] Migration reconciliation is reviewed against actual production schema before any migration is applied.
- [ ] Index/trigger cleanup is justified by workload evidence and tested on staging.
- [ ] Project quality checks and GitHub Pages deployment succeed.

The dashboard password setting and authenticated end-to-end tests remain externally dependent until those verification steps are actually completed.
