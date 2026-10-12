# Production Audit — 2026-10-12

Scope: read-only inspection of the GitHub `main` tree and the connected Supabase production project. No database, Auth, Storage, or Edge Function settings were changed during this audit.

## Findings

### P1 — Production migration history and repository files are not aligned

- Supabase production reports **45 applied migrations**.
- The current repository contains **24 SQL migration files**.
- **33 production ledger entries have no exact matching filename** in the repository.
- **12 repository migration filenames do not match an applied ledger entry** by exact version/name.

This is a migration-history/source-of-truth drift finding, not proof that production schema is broken. Some entries may represent renamed, rewritten, or superseded migrations. Do **not** blindly replay or delete migrations. Before future schema changes, compare the live schema with the repository, recover historical migration SQL where possible, and document any intentionally squashed/replaced history.

### P1 — A deployed Edge Function is missing from the repository

Production reports these active functions with JWT verification enabled:

- `admin-user-management` — version 5
- `cleanup-recycle-bin` — version 4
- `resolve-map-link` — version 6

The repository contains source files for the first two, but no `supabase/functions/resolve-map-link/index.ts`. The deployed map resolver has URL/redirect allow-list checks, response-size and timeout limits, and coordinate validation. Its exact deployed source should be recovered and committed before the next backend deployment. Do not replace it with a guessed implementation.

### P1 — Leaked-password protection is disabled

Supabase Security Advisor reports **Leaked Password Protection Disabled**. Enable this in the Supabase Authentication security settings. This is an Auth dashboard configuration action; it is not safe to treat a client-side password length check as a replacement.

Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### Positive security checks

- All **16 public tables** inspected have Row Level Security (RLS) enabled.
- Storage object access is policy-controlled. The inspected policies show authenticated, owner-scoped profile-picture uploads and admin-restricted hero-image writes; public access is read-only for the configured public buckets. No anonymous INSERT policy was found in the inspected Storage policies.
- The inspected privileged database functions include explicit execute grants; public admin functions are not executable by `anon` or `authenticated` according to their current ACLs.
- The Supabase Security Advisor returned the leaked-password warning above; no other security lint finding was returned in this scan.

### Storage configuration observed

| Bucket | Public reads | Upload size limit | Allowed MIME types |
|---|---:|---:|---|
| `content-files` | No | 50 MiB | Images, selected video/audio formats, PDF |
| `hero-images` | Yes | 10 MiB | JPEG, PNG, WebP |
| `profile-pictures` | Yes | 5 MiB | JPEG, PNG, WebP |

Public-read buckets are appropriate only for media intended to be public. Keep private files in `content-files` and verify every upload path checks authorization and file type.

### P2 — Unused indexes reported

Supabase Performance Advisor reports **14 indexes as unused**. This is informational, not a recommendation to delete them immediately. Low current traffic, recent index creation, or future query paths can make an index appear unused. Review query plans and production workload over a representative period before removing any index.

### Frontend maintainability and performance

- The current production frontend is still a static HTML/CSS/JavaScript application; `app.js` is approximately 267 KB and contains multiple responsibilities.
- The homepage template fetch and site-configuration reads have been optimized in a separate, CI-checked change. The expected effect must still be measured in a real browser using Network timing and Core Web Vitals.
- The Supabase browser SDK is currently loaded from a major-version CDN URL (`@2`) rather than an exact tested version. Before a build-system migration, select a supported SDK version, pin it, and use a lockfile.

## Required follow-up order

1. Recover and commit the exact deployed `resolve-map-link` source.
2. Reconcile production migration history with repository SQL; do not replay unknown migrations.
3. Enable leaked-password protection in Supabase Auth settings.
4. Measure homepage loading in a real browser and test login, homepage rendering, dashboard saves, gallery/media access, and mobile interactions.
5. Add RLS/Storage regression tests and a controlled local Supabase migration workflow.
6. Migrate to TypeScript + React/Vite incrementally only after the current behavior is covered by tests.
7. Consider NestJS only if a concrete server-side requirement justifies a separately hosted backend.

## Audit limitation

This was a read-only schema/policy/advisor inspection plus repository inspection. It did not include a complete browser-driven penetration test, real-user performance measurement, or restoration test from a database backup.
