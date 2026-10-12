# Migration Semantic Triage — 2026-10-12

## Scope

This is a read-only comparison of selected repository migration SQL against the live Supabase catalog. It extends the migration inventory and follow-up reports. No SQL, migration ledger, table, policy, bucket, function, trigger, Auth setting, or data was changed.

Git baseline: `main` at `0235c2d81c44ee94fd173f8450cc2b2e91209e75`.
Backup branch: `backup/68-before-migration-semantic-triage-20261012`.

## Confirmed mismatches and disposition

| Repository migration | Live observation | Disposition |
| --- | --- | --- |
| `20261010195600_create_media_library.sql` | `public.media_assets` and `public.media_links` exist, but live `media_assets` has `storage_bucket` and no `public_url` column. The migration's `media-library` bucket is absent. Live media storage uses private `content-files`. Live table policies use `private.has_permission(...)` plus admin checks, rather than the migration's blanket admin-only policy. | **Do not replay.** The local migration is not an exact representation of the live schema and policy model. |
| `20261010210000_create_public_media_uploads.sql` | `public.public_media_uploads` and `public-media-inbox` bucket are absent. Its SQL grants insert to `anon` and `authenticated` and defines anonymous-session upload policies. | **Treat as obsolete/unresolved; do not replay.** Recreating it would introduce an upload surface that is absent from production. |
| `20261010230000_grant_admin_full_access_to_app_data_and_storage.sql` | Current storage/content policies include permission-based checks such as `private.has_permission('content.create')`, `content.edit`, `content.delete`, and explicit admin checks. | **Do not replay.** It creates broad generic admin policies and is not a safe way to align current policy history. |
| `20261010235000_admin_only_home_media_uploads.sql` | It alters policies on `public.public_media_uploads`, which is absent. | **Dependent on an absent/obsolete object; do not replay.** |
| `20261011020000_remove_pages_feature.sql` and `20261011030000_restore_page_feature.sql` | `public.pages` exists in production with media/content columns and role/permission-based policies. | Their net effect cannot be reconstructed from the filenames alone. **Do not run either migration to reconcile history.** |
| `20261010112000_profiles_canonical_source.sql` | `public.profiles` exists; `public.sync_auth_user_profile()` exists and is attached to Auth user events. Two separate AFTER INSERT triggers call this same function, and a third trigger calls it after metadata updates. | The live behavior is present, but trigger history is not a one-to-one match with the local file. The two insert triggers appear redundant because the function uses conflict-safe insertion; leave unchanged until the origin and intended trigger set are established. |
| `20261010235900_protect_super_admin_account.sql` | The private trigger function exists; delete and role-update protection triggers are attached to `auth.users`. The function is SECURITY DEFINER with `search_path = pg_catalog`, and its EXECUTE privilege is revoked from public/client roles. | Protection appears active in the inspected catalog. Do not replay just to match filenames. |
| `20261011005800_add_media_column_to_albums.sql` | `public.albums.media` exists as `jsonb`. | Schema effect is present; exact historical SQL remains unverified. |
| `20261011010000_add_custom_url_to_posts.sql` | `public.post.custom_url` exists as `text`. | Schema effect is present; exact historical SQL remains unverified. |
| `20261011143000_secure_cleanup_recycle_bin_authorization.sql` | `public.edge_function_secrets` exists with RLS enabled, no client-role table grants, and a service-role-only SELECT policy. One secret row named `cleanup-recycle-bin` exists. | The database-side secret container is present. Its value was not retrieved or exposed, and the deployed Edge Function source could not be retrieved; do not infer end-to-end authorization correctness from table existence alone. |

## Additional live storage observations

- `content-files` is private with a 50 MiB limit.
- `hero-images` is public with a 10 MiB limit.
- `profile-pictures` is public with a 5 MiB limit.
- The `content-files` bucket has separate policies for public-folder reads, admin operations, and users with specific content permissions.
- No policy/table/bucket changes were made during this inspection.

## Remaining uncertainty

The live migration ledger still has 45 entries while the repository has 24 SQL files. Exact filename comparison alone does not prove a schema defect, but several local-only migrations are demonstrably unsafe to replay against the current live state.

No authoritative original SQL for the 33 production-only migration records has been recovered. A few older Git backup branches contain other local migration variants, but they do not establish that those files are the exact SQL applied in production. Do not restore or replay them based on matching names or dates.

## Recommended reconciliation sequence

1. Preserve a read-only schema/policy/trigger export from production.
2. Obtain exact historical SQL from deployment artifacts, CI logs, trusted backups, or the original migration environment.
3. Compare each migration's statements and effects to the live catalog and classify it as exact, equivalent/renamed, superseded, or unresolved.
4. Rebuild the proposed history in an isolated disposable Supabase database and compare schema, grants, policies, triggers, and function definitions.
5. Only after review decide whether to restore historical files or document a baseline. Treat migration-ledger repair separately from schema/data changes.

## Explicitly not done

- No `supabase db push`, migration replay, `migration repair`, schema mutation, policy change, trigger removal, index deletion, Auth setting change, or Edge Function deployment.
- No claim of full end-to-end testing or complete migration reconciliation.
