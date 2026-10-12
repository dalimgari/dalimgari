# Production Follow-up Audit — 2026-10-13

This report records the follow-up checks performed after the homepage loading optimization. Production schema and settings were inspected read-only. No database DDL, migration-ledger edits, index drops, trigger changes, or production Edge Function redeployments were performed.

## 1. Work completed in this change

- Retrieved the currently deployed `resolve-map-link` Edge Function source from Supabase, version 6.
- Confirmed the deployed function has `verify_jwt: true`.
- Restored the retrieved source into `supabase/functions/resolve-map-link/index.ts` so the repository can be reviewed against the deployed implementation.
- Added Node regression tests for the URL allowlist, redirect validation, time/body limits, response content type, coordinate bounds, and safe error behavior.
- Created a pre-change backup branch: `backup/70-before-next-audit-fixes-20261013`.

## 2. Edge Function source review

The retrieved source applies these controls:

- HTTPS only; rejects URL username/password and nonstandard ports.
- Exact allowlist of Google Maps hosts; Google Maps domains must use a `/maps` path.
- Manual redirect handling with a maximum of five redirects; each destination is checked before another request is made.
- Ten-second per-request timeout and a two-megabyte HTML response limit.
- Requires an HTML content type and validates latitude/longitude ranges.
- Limits input URL length to 4,096 characters and uses `Cache-Control: no-store`.
- Supabase currently enforces JWT verification at the Edge Function gateway.

The repository change restores source and adds regression guards only. It does **not** redeploy the function or change its production behavior. The wildcard CORS origin should be reviewed against actual calling origins; it is not, by itself, an authorization control. JWT verification remains enabled.

## 3. Password security — action still required in Supabase Dashboard

The latest Security Advisor still reports **Leaked Password Protection Disabled**. The connected project tools expose read-only advisor/config inspection, but no supported Auth setting update action; this setting was not changed.

Enable leaked-password protection in the Supabase Dashboard under **Authentication → Settings / Password Security** (the exact labels may vary), then rerun the Security Advisor and confirm the warning disappears. Do not treat this as completed until verified.

Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## 4. Index review — no indexes dropped

The Performance Advisor reports 14 candidate unused indexes. A read-only query of `pg_stat_user_indexes` returned `idx_scan = 0` for all 14, with index sizes from 8 KiB to 24 KiB.

This is not enough evidence to drop them: usage counters may reset, and indexes may support infrequent admin, authorization, or recovery paths. Before any removal, retain a baseline, inspect index definitions and constraints, inspect representative query plans and workload, and test on a staging copy. No index was dropped.

Reference: https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index

## 5. Profile synchronization triggers — duplicate confirmed, not removed

Read-only catalog inspection found two `AFTER INSERT` triggers on `auth.users` invoking `sync_auth_user_profile()`:

- `on_auth_user_created_profile`
- `sync_auth_user_profile_after_insert`

A third trigger handles changes to `raw_user_meta_data`. The duplicate insert triggers appear redundant, but no trigger was removed because the original migration history is not fully reconciled. Verify the function's conflict behavior and expected side effects, then remove only the confirmed redundant trigger in a separately reviewed migration.

## 6. Migration history — do not replay old migrations

Production currently has 45 migration ledger entries, while the repository has 24 SQL migration files. Prior exact-name reconciliation found mismatches in both directions. Several local migrations do not match the live schema or current security model; in particular, historical migrations propose anonymous media-upload policies, a different media bucket/schema, or broad admin grants.

Do **not** run `supabase db push`, replay unmatched migrations, or edit migration history to make the lists match. Recover the exact original SQL and deployment history first, then produce a read-only semantic reconciliation for every unmatched entry. No production schema or migration ledger was changed during this follow-up.

## 7. Homepage performance — parallelization deployed; real browser timings remain unmeasured

The prior main-branch change parallelizes independent homepage reads. Current `home.html` is a lightweight section template; the data-fetch/render logic remains in `app.js`. The change is deployed, but this runtime cannot execute a real browser session or access the public site over the network, so it cannot provide trustworthy mobile/desktop Navigation Timing, LCP, or API waterfall measurements.

Next validation should use Chrome DevTools (preferably a mobile profile, cache disabled for a cold run, then a warm run) and record:
- navigation start to DOMContentLoaded and load;
- LCP and any long tasks;
- `home.html`, `app.js`, Supabase query, and media request durations;
- repeated cold/warm runs before and after the optimization.

Do not claim a quantified speedup until these measurements exist. If `home.html` still feels slow, use the request waterfall to distinguish slow Supabase queries from image transfer, JS execution, and render blocking before changing the implementation again.

## 8. End-to-end validation still required

The existing Node test suite checks source-level regressions, not full browser behavior. After the source-restoration PR passes CI, manually or with a browser-based test environment verify:

1. Anonymous visitor can load the public homepage and permitted public media.
2. Signed-in user can sign in/out and complete password recovery.
3. Authorized admin can create/edit/delete permitted content; non-admin cannot.
4. Private `content-files` media is served only through authorized/expiring signed URLs.
5. Album cards and page sections render once and retain intended ordering.
6. Map resolver works with a valid Google Maps share link and rejects unsupported hosts/redirects.

## Current status

- **Completed in branch:** deployed Edge Function source recovered and restored; static security regression tests added.
- **Still requires dashboard action:** enable leaked-password protection and verify advisor result.
- **Still requires evidence before changes:** index removal, duplicate-trigger cleanup, migration-history reconciliation, real-browser performance measurement, and full end-to-end testing.
