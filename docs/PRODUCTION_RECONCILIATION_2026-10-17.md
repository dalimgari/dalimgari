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

A live read-only call to Supabase returned **52 migration ledger entries**. After reconciliation, **21 exact versioned filenames** are represented in the active repository migrations directory. The remaining **31 live-ledger versions** have no exact filename in the repository. Five unverified repository-only SQL candidates were moved to `docs/migration-archive/unverified/` as plain-text copies and removed from the active migration directory so they cannot be unexpectedly applied by `supabase db push`.

### Semantic filename reconciliations

The following six files now use the matching live-ledger version prefix:
- `20261014084543_add_bilingual_content_fields.sql`
- `20261014101715_add_bilingual_media_metadata.sql`
- `20261010182503_grant_admin_full_access_to_app_data_and_storage.sql`
- `20261010185057_protect_super_admin_account.sql`
- `20261010215858_add_media_column_to_albums.sql`
- `20261010220303_add_custom_url_to_posts.sql`

The available SQL was compared with relevant live schema objects, columns, policies, or function/trigger definitions. These are **semantic filename reconciliations using available repository SQL**, not proof that the SQL bytes are identical to the original SQL applied in production.

### Live-ledger versions still lacking exact repository filenames

```text
20261009215349 create_admin_messaging_and_quota
20261009215416 schedule_admin_message_expiry_cleanup
20261009215604 enforce_total_message_file_quota
20261009215709 enable_pg_net_for_message_cleanup
20261009215731 fix_message_cleanup_cron_schema
20261009215804 grant_cleanup_function_message_table_access
20261009224129 remove_messaging_feature
20261009230258 dashboard_content_management_and_external_media
20261009230359 secure_site_media_storage_bucket
20261009230439 post_media_relationships
20261009231119 rename_url_slug_columns_to_url
20261009232306 create_admin_recycle_bin
20261009234533 make_post_media_self_contained
20261009234559 allow_post_media_recycle_bin
20261009235134 add_single_media_fields_to_posts
20261009235213 rename_posts_table_to_post
20261010001441 prepare_post_media_upload
20261010095316 remove_message_cleanup_and_optimize_security_performance
20261010095402 optimize_admin_write_policies
20261010101635 remove_remaining_messaging_database_artifacts
20261010103700 repair_existing_profile_sync
20261010121835 create_admin_media_upload_tests
20261010132827 add_profile_picture_storage
20261010143039 public_home_hero_read_access
20261010182935 restrict_home_media_uploads_to_admin_only
20261010222515 remove_dashboard_hidden_fields
20261010222542 restore_core_customization_storage
20261011013318 central_media_library
20261011160530 harden_permissions_rpc_and_deduplicate_pages_policy
20261014103615 add_bangla_profile_fields
20261014124253 add_bilingual_media_metadata_ui_compat
```

### Safety decisions

- No production migration ledger rows were edited.
- No SQL migration was replayed and no production DDL was run.
- No placeholder migrations were fabricated.
- Five unverified migration candidates were preserved outside the active migrations directory. See `docs/migration-archive/README.md`.
- A spot-check of GitHub's exact-path commit history for ten high-priority missing migrations found no commits at those exact file paths. The remaining source SQL must be recovered from other commits, deployment records, or backups, or explicitly classified against the live catalog.
- Do not run `supabase db push` or migration repair to force the counts to match. The unresolved historical SQL must be addressed before a safe clean-install baseline can be claimed.

Current inventory:
- Live ledger entries: 52
- Exact versioned filenames in active migrations directory: 21
- Live-ledger versions still lacking exact filenames: 31
- Active repository migration files without an exact live-ledger version: 0
- Unverified candidates archived outside active migrations: 5

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
