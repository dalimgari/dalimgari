# Supabase baseline inventory — 2026-10-11

> This is a metadata/inventory snapshot only. It is NOT a full database backup and cannot restore table data, auth users, Storage object bytes, Vault secrets, or project configuration. No credentials or secret values are included.

## Project
- Project ref: `yopfogoyjxwxplnabqii`
- Region: `ap-southeast-2`
- PostgreSQL: `17.6.1.166` (engine 17)
- Status at capture: `ACTIVE_HEALTHY`
- Capture date: 2026-10-11 UTC

## Public table inventory
All listed public tables had RLS enabled during this audit.

| Table | Rows | Columns |
|---|---:|---:|
| profiles | 2 | 8 |
| user_roles | 0 | 3 |
| roles | 1 | 5 |
| permissions | 7 | 5 |
| role_permissions | 4 | 2 |
| hero_items | 1 | 9 |
| post | 1 | 13 |
| pages | 5 | 11 |
| albums | 2 | 10 |
| media_assets | 4 | 13 |
| media_links | 6 | 6 |
| widgets | 2 | 8 |
| site_customizations | 15 | 7 |
| site_settings | 0 | 7 |
| recycle_bin | 27 | 8 |
| edge_function_secrets | 1 | 3 |

## Storage buckets
| Bucket | Public | File size limit |
|---|---|---:|
| content-files | no | 50 MiB |
| hero-images | yes | 10 MiB |
| profile-pictures | yes | 5 MiB |

Storage object counts previously verified in this audit: 10 total objects (8 in `content-files`, 0 in `hero-images`, 2 in `profile-pictures`). Object bytes are not included in this manifest.

## Active Edge Functions
| Function | Live version | JWT gateway verification |
|---|---:|---|
| cleanup-recycle-bin | 4 | enabled |
| admin-user-management | 5 | enabled |
| resolve-map-link | 4 | enabled |

## Migration reconciliation
- SQL migration files in GitHub `main`: 21
- Applied migration history entries in live Supabase: 41
- Exact version matches: 9
- GitHub files whose versions are absent from live history: 12
- Live history versions whose SQL files are absent from GitHub `main`: 32

### GitHub files not in live migration history
- `20261010112000_profiles_canonical_source.sql`
- `20261010195600_create_media_library.sql`
- `20261010210000_create_public_media_uploads.sql`
- `20261010230000_grant_admin_full_access_to_app_data_and_storage.sql`
- `20261010235000_admin_only_home_media_uploads.sql`
- `20261010235900_protect_super_admin_account.sql`
- `20261011005800_add_media_column_to_albums.sql`
- `20261011010000_add_custom_url_to_posts.sql`
- `20261011020000_remove_pages_feature.sql`
- `20261011030000_restore_page_feature.sql`
- `20261011050000_english_widget_titles.sql`
- `20261011143000_secure_cleanup_recycle_bin_authorization.sql`

### Live migration history entries with no matching file in GitHub main
- `20261009215349` create_admin_messaging_and_quota
- `20261009215416` schedule_admin_message_expiry_cleanup
- `20261009215604` enforce_total_message_file_quota
- `20261009215709` enable_pg_net_for_message_cleanup
- `20261009215731` fix_message_cleanup_cron_schema
- `20261009215804` grant_cleanup_function_message_table_access
- `20261009224129` remove_messaging_feature
- `20261009230258` dashboard_content_management_and_external_media
- `20261009230359` secure_site_media_storage_bucket
- `20261009230439` post_media_relationships
- `20261009231119` rename_url_slug_columns_to_url
- `20261009232306` create_admin_recycle_bin
- `20261009234533` make_post_media_self_contained
- `20261009234559` allow_post_media_recycle_bin
- `20261009235134` add_single_media_fields_to_posts
- `20261009235213` rename_posts_table_to_post
- `20261010001441` prepare_post_media_upload
- `20261010095316` remove_message_cleanup_and_optimize_security_performance
- `20261010095402` optimize_admin_write_policies
- `20261010101635` remove_remaining_messaging_database_artifacts
- `20261010103700` repair_existing_profile_sync
- `20261010121835` create_admin_media_upload_tests
- `20261010132827` add_profile_picture_storage
- `20261010143039` public_home_hero_read_access
- `20261010182503` grant_admin_full_access_to_app_data_and_storage
- `20261010182935` restrict_home_media_uploads_to_admin_only
- `20261010185057` protect_super_admin_account
- `20261010215858` add_media_column_to_albums
- `20261010220303` add_custom_url_to_posts
- `20261010222515` remove_dashboard_hidden_fields
- `20261010222542` restore_core_customization_storage
- `20261011013318` central_media_library

## Safety notes
- Do not run `supabase db push`, `supabase db reset`, or bulk/replayed migrations until the drift is reconciled.
- Before schema reconciliation, obtain a real database backup using Supabase CLI: separate roles, schema, and data dumps. Keep these files private/off-repository.
- Storage object bytes require a separate export; SQL metadata alone is insufficient.
- Vault values and Edge Function secrets are intentionally excluded.
- The migration `20261011143000_secure_cleanup_recycle_bin_authorization.sql` exists in GitHub but has not been applied as a migration history entry; its related schema change was made directly in the live database during the prior security fix. This is part of the drift to reconcile, not a reason to replay the file blindly.
