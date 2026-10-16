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

### Live-ledger versions without an exact `main` filename

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
20261010182503 grant_admin_full_access_to_app_data_and_storage
20261010182935 restrict_home_media_uploads_to_admin_only
20261010185057 protect_super_admin_account
20261010215858 add_media_column_to_albums
20261010220303 add_custom_url_to_posts
20261010222515 remove_dashboard_hidden_fields
20261010222542 restore_core_customization_storage
20261011013318 central_media_library
20261011160530 harden_permissions_rpc_and_deduplicate_pages_policy
20261014084543 add_bilingual_content_fields
20261014101715 add_bilingual_media_metadata
20261014103615 add_bangla_profile_fields
20261014124253 add_bilingual_media_metadata_ui_compat
```

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
