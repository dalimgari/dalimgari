# Dalimgari remediation status — 2026-10-16

## Changes in this branch

- Adds regression tests that prevent privileged Supabase credentials from being referenced by browser-delivered files.
- Asserts that the GitHub Pages artifact excludes repository metadata, backups, tests, docs, and Supabase source/migrations.
- Adds regression checks for existing Edge Function safeguards: authenticated user lookup and permission checks for user management; Super Admin protection; recycle-bin cleanup secret, bucket allowlist, active-reference check and expiry; Google Maps host/HTTPS/redirect/timeout validation.
- Does not change production runtime behavior, database schema, RLS policies, Storage policies, Auth settings, or deployed Edge Functions.

## Live checks performed

- Supabase project is active and healthy.
- Security Advisor currently reports **Leaked Password Protection Disabled**. This is an Auth dashboard/project setting; the available project/database connector can inspect the finding but cannot toggle this setting. It must be enabled in Supabase Dashboard under Authentication / Security and then re-verified with Security Advisor.
- Performance Advisor reports 13 unused indexes. These are informational candidates, not proof of defects. They are intentionally not dropped without query-usage review and workload evidence.
- The fresh exact-version comparison returns 52 live migration ledger entries and 26 repository SQL files: 15 exact version matches, 37 live-only versions, and 11 repository-only versions. Exact comparison is now documented in `docs/P1-P2-remediation-report-2026-10-16.md`; semantic SQL/history reconciliation remains unresolved. Do not replay, reset, repair, or rewrite migration history as a shortcut.
- All four live Edge Function entrypoints were compared against repository source. `resolve-map-link` v6, `cleanup-recycle-bin` v7, and `translate-bilingual` v2 match byte-for-byte. `admin-user-management` v5 differed: the deployed version supports the `users.manage` permission RPC, while repository source only allowed the admin role. This branch updates the repository source to match the currently deployed v5 implementation and adds a regression check. No Edge Function was redeployed.
- Existing GitHub Actions include project checks and a three-run mobile Lighthouse audit. This branch adds static regression checks; it does not claim browser tests or a new Lighthouse baseline have run.

## Detailed P1/P2 report

See `docs/P1-P2-remediation-report-2026-10-16.md` for the fresh exact migration diff, live Storage/RLS inventory, index-statistics caveats, and completed vs outstanding P1/P2 gates.

## Release gates still required

1. Enable leaked-password protection in Supabase Dashboard and confirm the Security Advisor warning disappears.
2. Confirm GitHub Actions checks pass for this branch.
3. Run the production Lighthouse workflow and compare the three runs against the previous baseline.
4. Run mobile/desktop browser smoke tests for Home, Login, Profile, Gallery, Dashboard CRUD, uploads, and recycle-bin restore/purge.
5. Reconcile repository migration files against the live ledger before making any migration-history change.
6. Do not merge or deploy until checks pass; keep production schema, data, RLS, Storage policies, and existing feature behavior intact.
