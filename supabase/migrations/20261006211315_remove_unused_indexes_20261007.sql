-- Remove indexes that were initially reported as unused.
-- A follow-up migration restores the foreign-key covering indexes because
-- the database advisor correctly identifies those indexes as required for FK coverage.
drop index if exists public.role_permissions_permission_id_idx;
drop index if exists public.user_permissions_permission_id_idx;
drop index if exists public.user_roles_role_id_idx;
drop index if exists public.site_settings_updated_by_idx;
drop index if exists public.posts_user_id_idx;
