# P1/P2 Remediation Report — 2026-10-16

## Scope and outcome

This report records verified work and remaining release gates for the Dalimgari project. No production deployment, schema change, RLS/Storage policy change, migration replay, index removal, Auth setting change, or Edge Function redeployment was performed in this pass.

## Completed / verified

- The existing project-quality workflow passed on audit PR #94 (run 367, job `quality`).
- The audit branch reconciles the repository copy of `admin-user-management` with deployed v5 source and adds regression checks for browser-secret references, Pages deployment exclusions, user-management permission checks, Super Admin protection, recycle-bin cleanup safeguards, and map resolver URL safeguards.
- Live Edge Function source parity was checked: `resolve-map-link` v6, `cleanup-recycle-bin` v7 and `translate-bilingual` v2 match repository source; `admin-user-management` v5 is reconciled in the PR branch. No function was redeployed.
- Live public-schema inventory: 16 tables, all 16 with RLS enabled; 46 policies observed.
- Live Storage buckets: private `content-files` (12 objects, 50 MiB limit), public `profile-pictures` (2 objects, 5 MiB limit), public `hero-images` (0 objects, 10 MiB limit).
- The live migration ledger was freshly retrieved and compared by exact version with the `main` repository directory.

## Migration ledger exact-version comparison

Fresh snapshot:
- Production ledger entries: 52
- SQL files in `supabase/migrations/` on `main`: 26
- Exact version matches: 15
- Production versions without an exact repository filename: 37
- Repository files without an exact production version: 11

### Production-only versions (exact filename/version absent from repository)

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

### Repository-only versions (exact production version absent)

```text
20261010112000_profiles_canonical_source.sql
20261010195600_create_media_library.sql
20261010230000_grant_admin_full_access_to_app_data_and_storage.sql
20261010235000_admin_only_home_media_uploads.sql
20261010235900_protect_super_admin_account.sql
20261011005800_add_media_column_to_albums.sql
20261011010000_add_custom_url_to_posts.sql
20261011050000_english_widget_titles.sql
20261011143000_secure_cleanup_recycle_bin_authorization.sql
20261014090000_add_bilingual_content_fields.sql
20261014140000_add_bilingual_media_metadata.sql
```

This exact-name comparison is completed; semantic reconciliation is not. Some version pairs may be renamed/equivalent, superseded, or obsolete. Their SQL bodies and historical order still need review against the live schema and trusted history. Do not replay, reset, repair, or rewrite production migration history to force the counts to match.

## Index review

Supabase Performance Advisor reports 13 unused-index candidates. The database's `pg_stat_database.stats_reset` is `NULL`, and current `pg_stat_user_indexes` shows zero scans for these candidates. That is insufficient evidence for deletion because the statistics reset/observation window is unknown and several indexes may support foreign keys or infrequent admin workflows. No indexes were dropped. Next step: inspect each definition and FK/query usage, gather workload evidence, then rehearse any proposed removal in staging.

## Confirmed outstanding blockers

### P1 — security and release verification

1. **Leaked Password Protection remains disabled.** Security Advisor still reports `auth_leaked_password_protection`. The available Supabase connector cannot change the Auth Dashboard setting. Enable it in Supabase Dashboard under Authentication / Password Security, then rerun Security Advisor and test signup/password change using a disposable account.
2. **Browser/API regression tests are not complete.** Static source checks are not end-to-end tests. Sign-in/out/recovery, permission denial, public/private content, signed URL expiry, CRUD, upload failure/retry, and recycle-bin restore/purge must be tested with a non-production test account.
3. **Fresh Lighthouse report has not been run in this pass.** The existing workflow `.github/workflows/performance-audit.yml` is manually dispatchable and measures the public homepage three times, but the connected GitHub actions tools do not expose a workflow-dispatch operation. Run it from Actions and inspect all three JSON/HTML reports before claiming any performance improvement.
4. **Migration semantic reconciliation remains incomplete.** The exact diff is now documented above, but source SQL recovery and catalog-by-catalog equivalence classification are still needed before any schema/migration operation.
5. **PR #94 is still a draft and not merged/deployed.** Its successful static CI does not satisfy the browser/performance gates.

### P2 — performance, recovery and architecture

1. **Unused indexes:** 13 Advisor findings remain intentionally unchanged pending workload evidence.
2. **Database/Storage restore test:** no restore drill was performed. A backup artifact alone is not proof of recoverability; test a database restore and representative Storage recovery in a safe environment.
3. **React/TypeScript migration:** not treated as production-ready. Complete route/feature parity, type generation, browser tests, performance checks, and rollback rehearsal before switching production.
4. **Media and UI flows:** no new real-browser verification was performed for duplicate upload, reference-safe deletion, signed URL expiry, mobile responsive behavior, or dashboard CRUD. These remain test gates, not confirmed failures.

## Release decision

Keep PR #94 unmerged until the dashboard-only password setting is fixed, the three-run Lighthouse report is reviewed, browser/API smoke tests are recorded, and migration discrepancies are semantically reconciled. No destructive database change is authorized by this report.
