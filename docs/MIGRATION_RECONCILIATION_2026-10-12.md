# Migration Ledger Reconciliation — 2026-10-12

## Purpose and safety boundary

This inventory compares the production Supabase migration ledger with SQL filenames in the GitHub `main` tree at commit `998512b0beac8009365cca32082705bc18e094c1`.

**This is an inventory only.** It does not prove that the production schema is broken, and it is not a migration plan. No SQL was replayed, renamed, deleted, or applied. Do not use `supabase db push`, `migration repair`, or manual ledger edits until each discrepancy is understood.

## Counts

- Production migration ledger entries: **45**
- SQL migration files in repository: **24**
- Production entries with no exact matching `<version>_<name>.sql` file: **33**
- Repository filenames with no exact matching production ledger entry: **12**

Exact filename matching is intentionally strict. Renamed/squashed migrations and equivalent SQL under a different timestamp can create a mismatch without implying that the underlying schema is wrong.

## Production ledger entries without exact repository filename

```text
20261009215349_create_admin_messaging_and_quota
20261009215416_schedule_admin_message_expiry_cleanup
20261009215604_enforce_total_message_file_quota
20261009215709_enable_pg_net_for_message_cleanup
20261009215731_fix_message_cleanup_cron_schema
20261009215804_grant_cleanup_function_message_table_access
20261009224129_remove_messaging_feature
20261009230258_dashboard_content_management_and_external_media
20261009230359_secure_site_media_storage_bucket
20261009230439_post_media_relationships
20261009231119_rename_url_slug_columns_to_url
20261009232306_create_admin_recycle_bin
20261009234533_make_post_media_self_contained
20261009234559_allow_post_media_recycle_bin
20261009235134_add_single_media_fields_to_posts
20261009235213_rename_posts_table_to_post
20261010001441_prepare_post_media_upload
20261010095316_remove_message_cleanup_and_optimize_security_performance
20261010095402_optimize_admin_write_policies
20261010101635_remove_remaining_messaging_database_artifacts
20261010103700_repair_existing_profile_sync
20261010121835_create_admin_media_upload_tests
20261010132827_add_profile_picture_storage
20261010143039_public_home_hero_read_access
20261010182503_grant_admin_full_access_to_app_data_and_storage
20261010182935_restrict_home_media_uploads_to_admin_only
20261010185057_protect_super_admin_account
20261010215858_add_media_column_to_albums
20261010220303_add_custom_url_to_posts
20261010222515_remove_dashboard_hidden_fields
20261010222542_restore_core_customization_storage
20261011013318_central_media_library
20261011160530_harden_permissions_rpc_and_deduplicate_pages_policy
```

## Repository SQL files without exact production ledger match

```text
20261010112000_profiles_canonical_source
20261010195600_create_media_library
20261010210000_create_public_media_uploads
20261010230000_grant_admin_full_access_to_app_data_and_storage
20261010235000_admin_only_home_media_uploads
20261010235900_protect_super_admin_account
20261011005800_add_media_column_to_albums
20261011010000_add_custom_url_to_posts
20261011020000_remove_pages_feature
20261011030000_restore_page_feature
20261011050000_english_widget_titles
20261011143000_secure_cleanup_recycle_bin_authorization
```

## Reconciliation procedure

1. Export or retrieve the authoritative production schema and migration ledger; preserve an untouched copy.
2. For each mismatched item, find historical SQL from Git history, pull requests, release artifacts, or backups. Do not reconstruct destructive SQL from a migration title alone.
3. Compare candidate SQL to the current live schema and security policies. Mark each item as exact historical migration, equivalent/renamed migration, intentionally superseded migration, or unresolved.
4. Rebuild a clean local Supabase environment from the proposed repository history and compare its schema/policies with production.
5. Test future migrations on a separate development database/branch first.
6. Only then decide whether to restore historical files, document a baseline/squash, or repair migration metadata. Any ledger repair must be reviewed separately from schema changes.

## Related source-of-truth issue: deployed Edge Function

Production lists `resolve-map-link` version 6 with JWT verification enabled. The current `main` tree does **not** contain `supabase/functions/resolve-map-link/index.ts`. Retrieval of its deployed bundle failed during this reconciliation attempt. Do not deploy or replace this function until the exact deployed source can be recovered and compared.

## Security setting requiring dashboard action

The Supabase Security Advisor currently reports `auth_leaked_password_protection` as a warning. Enable leaked-password protection in Supabase Authentication settings, then rerun the advisor to confirm the warning is cleared:
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
