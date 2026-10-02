# Supabase migration sync

The production project currently reports 27 applied migrations in `supabase_migrations.schema_migrations`.

The repository contains the current migration chain under `supabase/migrations/`. Several historical production migration timestamps/names differ from the repository because later migrations superseded or consolidated earlier work. Therefore the production migration history is **not byte-for-byte identical** to the repository history.

Current production schema verification performed on 2026-10-02:

- 19 public application tables are present.
- All 19 application tables have RLS enabled.
- Required foreign-key relationships for content/media/RBAC are present.
- Media Storage bucket and permission policies are present.
- Homepage, sidebar, rural visual, theme, labels, analytics and website-information tables are present.
- `get_sitemap_content`, `record_analytics_visit`, `current_user_has_permission` and `current_user_has_admin_access` are callable.

Repository policy:

1. New schema changes must be added as a new timestamped migration under `supabase/migrations/`.
2. Existing migration files must not be rewritten to change production history.
3. The DB contract test in `tests/db-contract.test.js` verifies application-table reachability and critical public RPCs when Supabase CI secrets are configured.
4. The GitHub Actions test workflow passes Supabase URL/anon-key secrets to the contract test.

The exact historical migration-name mismatch is intentionally documented rather than fabricating missing historical SQL. A future clean-environment verification should replay the repository migration directory against an isolated Supabase project before claiming byte-for-byte production reproducibility.
