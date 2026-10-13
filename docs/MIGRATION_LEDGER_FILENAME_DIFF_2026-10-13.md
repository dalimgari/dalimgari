# Supabase Migration Ledger Filename Diff — 2026-10-13

## Scope and safety

Comparison of the production Supabase migration ledger with SQL files in `main`. One new forward migration was applied to remove a redundant profile-insert trigger; existing migration records were not edited or replayed. This report does not imply that historical discrepancies have been resolved.

Repository baseline after the latest cleanup: `e9b7e373b5aa58d98d2aa549e734fce347ae75b5`.

## Snapshot

- Production migration ledger entries: **46**
- SQL migration files in `supabase/migrations/`: **25**
- Exact version matches: **13**
- Production ledger versions without an exact repository filename: **33**
- Repository SQL file versions without an exact production ledger entry: **12**

The newly applied migration `20261013184928 remove_duplicate_profile_insert_trigger` is now present in both the production ledger and repository. Other version mismatches remain unresolved. Version mismatch does not prove that the corresponding SQL change is missing. Names and SQL contents must be compared to distinguish renamed/equivalent migrations from omitted, superseded, obsolete, or unknown history.

## Production ledger entries without an exact repository filename

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
```

## Repository SQL files without an exact production ledger entry

```text
20261010112000_profiles_canonical_source.sql
20261010195600_create_media_library.sql
20261010210000_create_public_media_uploads.sql
20261010230000_grant_admin_full_access_to_app_data_and_storage.sql
20261010235000_admin_only_home_media_uploads.sql
20261010235900_protect_super_admin_account.sql
20261011005800_add_media_column_to_albums.sql
20261011010000_add_custom_url_to_posts.sql
20261011020000_remove_pages_feature.sql
20261011030000_restore_page_feature.sql
20261011050000_english_widget_titles.sql
20261011143000_secure_cleanup_recycle_bin_authorization.sql
```

## Initial semantic comparison candidates — not yet proven equivalent

These pairs have similar migration names but different versions (and in some cases different filenames). Treat them as comparison candidates only; do not infer SQL equivalence from names.

| Production ledger | Repository file |
| --- | --- |
| `20261010182503 grant_admin_full_access_to_app_data_and_storage` | `20261010230000_grant_admin_full_access_to_app_data_and_storage.sql` |
| `20261010185057 protect_super_admin_account` | `20261010235900_protect_super_admin_account.sql` |
| `20261010215858 add_media_column_to_albums` | `20261011005800_add_media_column_to_albums.sql` |
| `20261010220303 add_custom_url_to_posts` | `20261011010000_add_custom_url_to_posts.sql` |
| `20261011013318 central_media_library` | `20261010195600_create_media_library.sql` |
| `20261010182935 restrict_home_media_uploads_to_admin_only` | `20261010235000_admin_only_home_media_uploads.sql` |

## Required next steps

1. Recover the exact original SQL for production-only versions from Git history, deployment artifacts, or a trusted backup.
2. Compare SQL bodies and ordering, not just migration names, against the current live catalog, policies, functions, triggers, grants, and Storage settings.
3. Classify every discrepancy as exact historical source, equivalent/renamed, superseded/obsolete, or unresolved; record evidence for each classification.
4. Rebuild the proposed canonical migration history in a disposable database and run regression/security tests before proposing any production change.
5. Keep migration-ledger repair separate from schema/data changes. Do not run `db push`, replay old migrations, use migration repair, or edit the production ledger solely to make counts match.

## Known caution

The repository migration `20261010210000_create_public_media_uploads.sql` does not have an exact production ledger entry, and a prior read-only catalog check found no `public.public_media_uploads` table. Do not replay it merely to align the ledger.
