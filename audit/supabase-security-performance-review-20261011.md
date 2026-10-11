# Supabase Security and Performance Review — 2026-10-11

Project ref: `yopfogoyjxwxplnabqii`  
Region: `ap-southeast-2`  
Scope: Read-only review of current Supabase Advisor results and selected database policy/function definitions.

> This is an audit report, not a database backup. It contains no credentials, secret values, or exported user data. No database schema, data, policy, Auth setting, or migration history was changed during this review.

## Findings

### Security Advisor

1. **Leaked Password Protection is disabled.** Enable it in Supabase Auth settings after confirming the project’s current password/authentication configuration.
2. **`public.get_my_permissions()` is SECURITY DEFINER and executable by `authenticated`.** Its body checks `auth.uid() is not null`, reads the caller's `app_metadata.role`, or derives permissions through `user_roles` and `role_permissions`. This may be intentional, but the function’s intended callers and grants should be reviewed before changing EXECUTE privileges or its security mode.
3. **Anonymous access policy warnings** occur on public content, media, profile/role/permission, recycle-bin and storage policies. An Advisor warning does not alone prove unauthorized access; inspect each policy's role target and predicate. Public read access for rows explicitly marked `visibility = 'public'` may be intentional.
4. **Cron schema policies** on `cron.job` and `cron.job_run_details` target `PUBLIC` and check `username = CURRENT_USER`. Review grants and effective access carefully; do not remove policies without confirming pg_cron's required operation model.

### Performance Advisor

- Three reported unindexed foreign keys: `public.media_assets.created_by`, `public.pages.album_id`, and `public.widgets.updated_by`. The live schema query also shows `pages.created_by` as a foreign key; verify the Advisor’s current result and index definitions before changes.
- Eleven indexes were reported unused in this snapshot. Do not drop them based solely on this finding; statistics may reset and low-frequency admin operations can still benefit.
- Five multiple-permissive-policy warnings were reported on `public.pages`, including duplicate/overlapping SELECT policies. Review equivalent predicates and preserve intended anonymous/public and authenticated/admin behavior before consolidating.

## Data protection and migration safety

- Live `public.pages` currently contains 5 rows.
- Do not run `20261011020000_remove_pages_feature.sql` against production without an explicit, verified plan; it is destructive to the Pages feature.
- Migration history and repository migration files remain out of sync. Do not use `supabase db push`, `db reset`, or replay historical migrations until each version is reconciled with the live schema and data.
- No full database dump, Storage-object byte backup, or restore test was created as part of this audit.

## Recommended order

1. Create full database backups (schema and data) and separately preserve Storage object bytes and required configuration.
2. Restore those backups into an isolated environment and verify.
3. Reconcile migration history against actual live schema before applying migrations.
4. Enable leaked password protection after checking Auth settings and user impact.
5. Review function grants and RLS policies individually; only make narrowly scoped changes with verification.
6. Add indexes only after checking existing indexes and expected query patterns; defer unused-index cleanup until adequate observation.

## Verification status

- Read-only Supabase Security Advisor queried on 2026-10-11.
- Read-only Supabase Performance Advisor queried on 2026-10-11.
- Function definition, function ACL, selected RLS policies, and relevant foreign-key constraints inspected.
- No production changes were made in this review.
