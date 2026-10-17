# Appwrite migration plan — Dalimgari

## Status

This branch prepares a safe migration from the current Supabase-backed Next.js application to Appwrite. The schema map, Appwrite environment template, and environment preflight check are committed. It does not switch production, remove Supabase dependencies, alter Supabase, or contain credentials.

- Current production application: Next.js App Router + React + TypeScript on Vercel.
- Current backend: active Supabase project; do not delete or modify during migration preparation.
- Current live migration ledger: 70 entries as read on 2026-10-18.
- Current Supabase Edge Functions observed: `admin-user-management`, `cleanup-recycle-bin`, `resolve-map-link`, `translate-bilingual`.
- Supabase Security Advisor currently reports leaked-password protection disabled. This should be addressed in the current provider independently of migration, if Supabase remains in use during the transition.
- Appwrite connector/project credentials are not available through the connected tools at the time this plan was written.

## Target architecture

- Next.js App Router, React, TypeScript, hosted on Vercel.
- Appwrite Auth for sessions and account lifecycle.
- Appwrite Database for application entities and relationships.
- Appwrite Storage for profile pictures and media.
- Appwrite Functions for trusted administrative operations, scheduled recycle-bin cleanup, map-link resolution, and bilingual translation.
- GitHub Actions for lint, typecheck, production build, and automated tests.

## Data and behavior that must be preserved

1. Profiles, account identity, profile pictures, and the protected Super Admin account.
2. Role and permission assignments. Authorization must be enforced on the server and in provider permissions; never trust user-editable profile fields.
3. Pages, sanitized HTML, public/private visibility, page ordering, and recycle-bin restore/30-day cleanup.
4. Albums, album order, gallery media relationships, posts, external custom URLs, and visibility.
5. Media Library metadata including required title, object path, visibility, duplicate detection, and reuse references.
6. Hero settings, widgets (Bangladesh local date/time and map), customization, and site settings.
7. Login, signup/email verification, password reset, profile editing, dashboard CRUD, and all public routes.
8. Existing responsive shell, navigation, accessible interactions, and security headers.

## Mapping approach

| Existing capability | Appwrite target | Required verification |
| --- | --- | --- |
| Supabase Auth | Appwrite Auth | Identity mapping, email verification, password reset, session renewal, account recovery |
| PostgreSQL tables and relations | Appwrite Databases/collections and document relationships | Export all schema, constraints, RLS intent, indexes, and data before designing collections |
| Supabase RLS policies | Appwrite collection/document permissions plus server-side authorization | Negative tests for guest/member/admin and cross-user access |
| Supabase Storage buckets | Appwrite Storage buckets | Object inventory, ACL mapping, file metadata, MIME/size checks, private download access |
| Edge Functions | Appwrite Functions | Reimplement trusted operations, timeouts, retries, secrets, and scheduled execution |
| SQL migrations | Versioned Appwrite setup/migration scripts | Idempotent setup, deterministic data import, checksums/count reconciliation, rollback plan |

## Execution gates

### Gate 1 — inventory and backup
- Export table definitions, all rows, relationships, indexes, constraints, policies, storage object metadata, and relevant Auth user metadata.
- Record the current production deployment and provider settings.
- Verify a restorable backup before any data-changing step.
- Do not export or commit passwords, access tokens, API keys, service-role keys, or other secrets to Git.

### Gate 2 — Appwrite project and environment
- Create the Appwrite project and required databases, collections, buckets, functions, and web platform configuration.
- Store Appwrite endpoint, project ID, database/collection IDs, and API keys in Vercel environment variables as appropriate.
- Never expose an Appwrite API key or privileged credential through a `NEXT_PUBLIC_*` variable or client bundle.

### Gate 3 — compatibility layer
- Add typed server-side Appwrite clients and a narrow data-access layer.
- Keep the current Supabase integration intact until Appwrite implementations and tests are ready.
- Avoid a big-bang switch. Migrate one capability at a time behind explicit server-side service boundaries.

### Gate 4 — migration and validation
- Import into a non-production Appwrite environment first.
- Compare record counts, IDs/references, visibility, file metadata, and checksums where feasible.
- Test guest/member/admin access, protected Super Admin behavior, CRUD, uploads/downloads, password reset, recycle-bin recovery, and scheduled cleanup.
- Run lint, typecheck, production build, unit/integration tests, and browser-level smoke tests.

### Gate 5 — cutover and rollback
- Only cut over after all critical feature-parity and security tests pass.
- Keep Supabase intact and read-only during the agreed observation period.
- Document rollback steps and confirm a tested backup before changing production environment variables.
- Remove old Supabase code and resources only after production stability is demonstrated and the owner approves final retirement.

## Current implementation status

- Added `docs/appwrite-schema-map.md` with the 16-table inventory, identity/authorization rules, storage notes, and cutover acceptance gates.
- Expanded `.env.example` with placeholders for Appwrite project settings; no real values or credentials are committed.
- Added `npm run appwrite:check` to verify required Appwrite environment variables are present and that the endpoint uses HTTPS. This is a local preflight only; it does not validate remote credentials.
- The existing application still uses Supabase. No Appwrite SDK/data-access implementation or production provider switch has been made because a real Appwrite project and its identifiers/credentials are not available in this connection.

## Blocking requirements

- A real Appwrite project is not currently connected to ChatGPT's available tools. Creating/configuring that project and validating provider-side settings cannot be completed from this connection alone.
- Production Auth users and passwords cannot be safely assumed portable. A tested account migration or user re-verification/reset strategy must be selected.
- Appwrite collection/document permissions do not automatically reproduce PostgreSQL RLS semantics. Every authorization rule must be translated and tested explicitly.
- This document is a plan, not evidence that migration, tests, or production cutover are complete.
