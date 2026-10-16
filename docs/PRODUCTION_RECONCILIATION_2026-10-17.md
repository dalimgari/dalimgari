# Production Reconciliation and Performance Fixes — 2026-10-17

## Scope and safety

This change hardens the map resolver's browser CORS policy, starts independent homepage section reads earlier, and adds source-level regression tests. It does not alter database rows, migration history, triggers, RLS policies, or production deployment.

## 1. Edge Function CORS

- The deployed `resolve-map-link` function was read-only inspected at version 6; Supabase reports `verify_jwt: true`.
- The repository source previously used `Access-Control-Allow-Origin: *`.
- The proposed source now allows browser response access only from `https://dalimgari.github.io`, returns 403 for a different explicit Origin, and emits `Vary: Origin`.
- Existing URL/redirect/response-size/time/coordinate validations remain.
- **Deployment is not complete until this branch is reviewed, merged, and the Edge Function is deployed.** If GitHub Pages is later moved to a custom domain, add that exact origin to `ALLOWED_ORIGINS` before deployment. CORS is not a substitute for JWT authorization.

## 2. Migration-history reconciliation

A live read-only call to Supabase returned **52 migration ledger entries**. Each exact `<version>_<name>.sql` path from the live ledger was checked in `main`: **15 exact paths were found and 37 exact paths were not found**. A missing exact path does not prove that the corresponding SQL is absent under a different filename or exists nowhere in Git history; it does prove that a simple name-based reconciliation is incomplete.

Do not replay migrations, manufacture placeholder SQL, delete ledger rows, or run `supabase db push` to force the counts to match. The safe repair is to recover the exact original SQL and deployment/PR history for each unmatched version, compare its effects with the live schema, then add a reviewed reconciliation baseline without replaying already-applied DDL. This branch intentionally does not mutate production schema or migration history.

## 3. Profile synchronization trigger

Live catalog inspection currently finds:
- `on_auth_user_created_profile`: canonical `AFTER INSERT` trigger.
- `sync_auth_user_profile_after_metadata_update`: intended metadata-update trigger.
- No `sync_auth_user_profile_after_insert` duplicate.

The live migration ledger contains `20261013184928_remove_duplicate_profile_insert_trigger`, and the matching repository migration drops that duplicate with `IF EXISTS`. Therefore, the duplicate-trigger issue is already resolved in the live database; applying another drop is unnecessary and was not attempted. The trigger catalog and function definition were checked read-only.

## 4. Homepage loading

`renderHomepageContentCards(siteConfig)` now starts immediately after the homepage sections are mounted, in parallel with the optional homepage-includes setting and page-pill configuration reads. Included HTML still waits for the card render to finish before replacing a target section, preventing a DOM race where late card rendering could overwrite included content.

This removes avoidable serialization in the frontend startup path. It does not claim a quantified LCP improvement: real browser measurements must still compare cold/warm mobile runs and request waterfalls.

## Validation still required

1. Run the GitHub Actions quality workflow for this branch.
2. Deploy the Edge Function after reviewing the origin allowlist and smoke-test a valid Maps URL from the production GitHub Pages origin.
3. Complete exact-source recovery for all 37 unmatched migration paths; only then create a reviewed semantic reconciliation plan.
4. Run browser E2E tests for homepage includes, page pills, album/widget cards, authentication, and map-link resolution.
5. Rerun Supabase advisors; the current live Security Advisor still reports leaked-password protection disabled. Reporting suppression is not a fix for that setting.
