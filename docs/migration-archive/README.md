# Archived migration candidates

These SQL files were present in `supabase/migrations/` but had version prefixes that do not exist in the live Supabase migration ledger. They have been preserved here as plain-text evidence and removed from the active migration directory to prevent an unverified `supabase db push` from applying them unexpectedly.

They are **not confirmed production migrations** and must not be replayed as a batch. Review each file against the original deployment record, current production schema, and intended clean-install sequence before restoring or rewriting any migration.

Reasons for quarantine:
- `20261010112000_profiles_canonical_source.sql`: includes profile backfill and Auth metadata updates; equivalent production history has not been proven.
- `20261010195600_create_media_library.sql`: defines an older Media Library schema and bucket configuration that differs from the current production schema.
- `20261010235000_admin_only_home_media_uploads.sql`: references `public.public_media_uploads`, which is absent in production.
- `20261011050000_english_widget_titles.sql`: updates widget title data but has no matching applied migration version; keep out of automatic migration execution until intentionally reviewed.
- `20261011143000_secure_cleanup_recycle_bin_authorization.sql`: defines a secrets table and policy that already exist in production, but this exact migration version is not in the live ledger.

Archiving these files does not repair the 31 missing historical SQL sources. It reduces the risk of accidentally running unverified migration candidates while that reconciliation continues.
