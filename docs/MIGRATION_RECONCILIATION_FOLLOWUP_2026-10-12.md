# Live Schema Reconciliation Follow-up — 2026-10-12

## Scope and safety

This is a read-only follow-up to [MIGRATION_RECONCILIATION_2026-10-12.md](./MIGRATION_RECONCILIATION_2026-10-12.md). It records a live catalog spot-check against Supabase project `yopfogoyjxwxplnabqii` after the initial inventory. No schema, data, migration ledger, Auth, Storage, or Edge Function was changed.

The GitHub baseline was `main` at `c611b6e4036023ec2fa33299e7a417c58fd2a628`; the follow-up test-only PR was merged afterward. No SQL migration files changed in that PR.

## Reconfirmed migration inventory

The current production migration ledger contains **45** entries. The repository contains **24** SQL migration files:
- **12** exact filename matches
- **33** production ledger entries with no exact repository filename
- **12** repository migration files with no exact production ledger entry

Exact filename mismatch is not proof of schema drift. A migration may have been renamed, created outside Git, superseded, or applied with a different timestamp. Conversely, an object existing in production does not prove that a particular local migration is equivalent to the SQL that created it.

## Read-only live catalog spot-check

The following objects/columns were present in production at the time of inspection:

| Object | Observed state |
| --- | --- |
| `public.albums.media` | Column exists; type `jsonb` |
| `public.post.custom_url` | Column exists; type `text` |
| `public.profiles` | Table exists; RLS enabled |
| `public.media_assets` | Table exists; RLS enabled |
| `public.pages` | Table exists; RLS enabled |
| `public.edge_function_secrets` | Table exists; RLS enabled |
| `public.albums` | Table exists; RLS enabled |
| `public.post` | Table exists; RLS enabled |
| `public.recycle_bin` | Table exists; RLS enabled |
| `public.sync_auth_user_profile()` | Function exists in `public` |
| `private.protect_dalimgari_super_admin()` | Function exists in `private` |
| `public.public_media_uploads` | Table was not found |

This is a targeted catalog check, not a complete schema dump. It did not verify every column constraint, trigger attachment, function body, grant, RLS predicate, storage object, or data row. In particular, the existence of `public.edge_function_secrets` does not prove its secret is provisioned or that the deployed cleanup function uses it correctly.

## Interpretation

1. At least some schema effects associated with repository-only migration themes are present in production (for example, media assets, page content, album media, custom post URLs, and super-admin protection).
2. `public.public_media_uploads` is absent, so the local migration `20261010210000_create_public_media_uploads.sql` must not be replayed merely to make the ledger match. Its intended behavior appears to be historical/obsolete, but this needs confirmation from Git history and deployment records.
3. Do not restore every missing production migration from titles alone. Some migrations describe destructive changes or policy replacements; reconstructing them from names risks changing live permissions or deleting data.
4. Do not run `supabase db push`, replay old SQL, use `migration repair`, or edit the production migration ledger during this investigation.

## Safe next steps

1. Obtain an authoritative schema/policy/function/trigger export and preserve it untouched.
2. Retrieve original SQL for the 33 production-only ledger entries from deployment artifacts, repository history, or a trusted backup.
3. Compare SQL semantics against the current live catalog and policies; classify each discrepancy as exact historical source, equivalent/renamed, superseded/obsolete, or unresolved.
4. Rebuild and test a disposable local database from the proposed canonical history before deciding whether to restore files or document a baseline.
5. Handle ledger metadata repair separately from any schema/data change, with a reviewed rollback plan.

## Separate unresolved blockers

- The deployed `resolve-map-link` Edge Function is active at version 6 with JWT verification enabled, but Supabase bundle retrieval currently fails and the function has no Git history at `supabase/functions/resolve-map-link/index.ts`. Do not replace or redeploy it with guessed code.
- Supabase Security Advisor still reports `auth_leaked_password_protection`. This is an Auth configuration setting; it has not been changed. Enable it in the Supabase Dashboard's Authentication password/security settings, then rerun the Security Advisor to verify that the warning clears.
- The Performance Advisor reports 14 unused indexes. No indexes were dropped; validate representative query plans and workload first.
