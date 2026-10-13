/**
 * Supabase client wiring is intentionally not duplicated here yet.
 * Before activation, move the existing project URL/key configuration into
 * environment-aware configuration and preserve current RLS-backed access.
 */
export const supabaseServiceStatus = "pending-safe-migration" as const;
