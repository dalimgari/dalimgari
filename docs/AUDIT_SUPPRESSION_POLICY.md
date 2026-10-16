# Audit suppression policy

All Dalimgari project audit reports must consult `.audit-suppressions.json` before presenting findings. A finding matching a suppression entry's exact source and rule ID is omitted from the active issue list and must not be reintroduced as an unresolved issue in a later report unless an administrator changes the registry.

## Current permanent reporting suppression

- Source: Supabase Security Advisor
- Rule ID: `auth_leaked_password_protection`
- Scope: reporting only; no expiration.
- Other security findings remain reportable.
- This entry does not change the live Supabase Auth setting and must never be described as fixing or enabling leaked-password protection.

If a scanner does not support this registry natively, its output must be post-processed against the registry before the report is published. Preserve the raw scan output separately where available; do not silently change the underlying security result.
