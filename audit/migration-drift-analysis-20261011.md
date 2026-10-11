# Migration drift analysis — 2026-10-11

## Decision
**No migration was executed and no migration history row was modified during this analysis.** A full database backup and restore verification are still required before any history repair or schema-changing migration.

## Verified mismatch
- GitHub `main`: 21 SQL migration files.
- Live `supabase_migrations.schema_migrations`: 41 entries.
- Exact version matches: 9.
- Repository-only versions: 12 (includes the new cleanup authorization migration).
- Live-only versions: 32.

## Critical migration safety findings
### Do not run `20261011020000_remove_pages_feature.sql`
This migration is destructive: it deletes recycle-bin entries for Pages, removes homepage page-order customizations, drops `public.pages` with CASCADE, and narrows the recycle-bin check constraint. The live database currently has 5 rows in `public.pages`; replaying this migration could delete current data and schema.

### Do not run `20261011030000_restore_page_feature.sql` blindly
It recreates `public.pages` and adds homepage customization seed values, but it is not in live migration history. The live schema already has `public.pages` (5 rows), so replaying it may not reproduce the original historical state and may change policies or seed settings.

### Repository-only migrations need effect-by-effect review
- `20261010112000_profiles_canonical_source.sql`: updates profile/Auth metadata and replaces a trigger function. This is data-mutating and should not be replayed without inspecting current profile values and the current function definition.
- `20261010195600_create_media_library.sql`: creates the old `media-library` model/bucket. Current project uses `media_assets` and `content-files`; replaying could reintroduce an obsolete bucket/schema.
- `20261010210000_create_public_media_uploads.sql`: creates the old public upload inbox model/bucket. Current bucket inventory does not include `public-media-inbox`; do not replay without a deliberate product decision.
- `20261010230000_grant_admin_full_access_to_app_data_and_storage.sql`: creates broad admin policies on all public tables and storage. Review against current granular permission model before any replay.
- `20261010235000_admin_only_home_media_uploads.sql`: targets the old `public_media_uploads` table and storage bucket.
- `20261010235900_protect_super_admin_account.sql`: creates a protective Auth trigger. A similar trigger/function is present in the live database, so this is a likely already-applied effect with missing history, but verify the exact function/trigger definition before recording history.
- `20261011005800_add_media_column_to_albums.sql`: the live `albums.media` column exists with the expected JSON-array check; likely already applied by another path/version.
- `20261011010000_add_custom_url_to_posts.sql`: the live `post.custom_url` column exists; likely already applied by another path/version.
- `20261011050000_english_widget_titles.sql`: updates data values. Current widget titles should be inspected before considering replay.
- `20261011143000_secure_cleanup_recycle_bin_authorization.sql`: the corresponding table and service-role-only policy were created directly in live DB during the security fix; the migration file is not recorded as applied. Do not replay just to make history look aligned; use controlled migration repair only after backup and verifying the exact resulting schema.

## Live-only history versions
The following 32 entries have no same-version SQL file in current GitHub `main`:
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

## Recommended reconciliation plan
1. Create and retain private `roles.sql`, `schema.sql`, and `data.sql` dumps from the live project using Supabase CLI, and export Storage object bytes separately. Do not place data dumps or connection strings in this public repository.
2. Verify that the dump files exist, have plausible non-zero size, and can be inspected/restored into an isolated test project.
3. Compare the live DDL/policies/functions/triggers with the repository migration effects.
4. Recover original migration files from commit history if possible; otherwise create a documented baseline/squash migration in a clean branch rather than fabricating historical migrations.
5. Use migration repair only for versions whose effects have been verified in live schema; never use it merely to silence version mismatch.
6. Test the proposed migration chain on a disposable Supabase branch/test project before production changes.

## Backup limitation
The available connected Supabase actions can inspect the project and run SQL but do not expose a full database dump/download action. Therefore a full restorable SQL backup has **not** been created by this workflow. The inventory document is metadata only and is not a substitute.
