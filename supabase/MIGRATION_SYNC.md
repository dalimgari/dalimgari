# Supabase migration sync

## Current state — 2026-10-03

The repository contains the authoritative forward migration chain under `supabase/migrations/`.

The production database migration history has been reconciled with the repository chain: **46 repository migration files and 46 production migration-history records have exact timestamp/name parity**. No destructive production database reset was used for that reconciliation.

### Live environment verification

- Production: 23 public application base tables.
- Production: 23/23 public base tables have RLS enabled.
- Production: 80 public RLS policies were verified in the latest audit.
- Production content/media/RBAC foreign-key integrity checks passed for the audited relationships.
- Critical authorization RPCs and private-schema security-definer grants were audited.
- Latest production security test run passed: 17/17 checks, 0 failures, 0 warnings.
- Leaked Password Protection is intentionally treated as an accepted project exception and is not a release blocker.

The development Supabase project is **not** a clean-room equivalent of production/repository history. Its current migration history contains 26 records with a different timestamp/name chain, and its live schema currently has 22 public base tables. It must not be reset destructively merely to make the history match.

### Reconciliation migrations

`20261002040000_environment_reconciliation.sql` is an additive, idempotent final-state guard. It converges environments created from an older snapshot without deleting application data and captures settings/analytics/RBAC contracts that were previously present in live production but were not fully represented by the repository migration chain.

`20261002030000_security_definer_grants_hardening.sql` hardens privileged `SECURITY DEFINER` RPC grants.

### Repository policy

1. New schema changes must be added as a new timestamped migration under `supabase/migrations/`.
2. Existing migration files must not be rewritten to alter production history.
3. No destructive reconciliation is performed automatically.
4. DB contract tests must run against a configured Supabase environment.
5. A **fresh isolated Supabase project/branch** must be used for a true clean-room replay of the complete repository migration directory. The existing development project is not suitable for this because its migration history is already divergent.
6. After clean-room replay, compare schema, RLS/policies, RPC/function security, storage configuration, and relevant application contracts with production before claiming full reproducibility.

### Remaining verification gate

**VERIFICATION REQUIRED:** clean-room migration replay has not yet been executed in a fresh isolated Supabase environment. This is the only remaining major migration-reproducibility verification gate identified in the current audit.

The existing production environment is healthy and its migration history currently matches the repository chain exactly; the remaining gap is independent replay verification, not a known production runtime/data-integrity defect.
