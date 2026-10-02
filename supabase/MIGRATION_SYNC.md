# Supabase migration sync

## Current state — 2026-10-02

The repository contains the authoritative forward migration chain under `supabase/migrations/`.

Historical production migration timestamps/names differ from some repository filenames because earlier work was consolidated or superseded. That historical migration table is **not byte-for-byte identical** to Git history and must not be rewritten to pretend otherwise.

### Live environment verification

- Production: 19 public application tables.
- Development: 19 public application tables.
- Production: 0 public application tables without RLS.
- Development: 0 public application tables without RLS.
- Content/media/RBAC foreign-key relationships are present.
- Homepage, sidebar, rural visual, theme, global labels, analytics and website-information contracts are present in both environments.
- Critical application RPCs are present in both environments.
- Privileged analytics/backup cleanup RPCs are no longer executable by `anon` or `authenticated` roles.
- Global-label creation is restricted to authenticated users with `settings_manage`; existing labels remain publicly readable.

### Reconciliation migrations

`20261002040000_environment_reconciliation.sql` is an additive, idempotent final-state guard. It converges environments created from an older snapshot without deleting application data and captures settings/analytics/RBAC contracts that were previously present in live production but were not fully represented by the repository migration chain.

`20261002030000_security_definer_grants_hardening.sql` hardens privileged `SECURITY DEFINER` RPC grants.

### Repository policy

1. New schema changes must be added as a new timestamped migration under `supabase/migrations/`.
2. Existing migration files must not be rewritten to change production history.
3. No destructive reconciliation is performed automatically.
4. DB contract tests must run against a configured Supabase environment.
5. Before claiming full reproducibility, replay the complete repository migration directory in an isolated clean Supabase project and compare the resulting schema/RLS/RPC/storage contract with production.

### Remaining verification gate

The live production/development schemas are now reconciled at the application-contract level, but **clean-room migration replay has not yet been executed**. Therefore the project must not yet claim byte-for-byte migration reproducibility.
