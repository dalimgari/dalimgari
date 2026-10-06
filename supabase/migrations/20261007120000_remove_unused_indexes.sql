-- Remove indexes confirmed unused by the Supabase performance advisor.
-- Foreign-key indexes are retained only where they are used by the workload.
drop index if exists public.role_permissions_permission_id_idx;
drop index if exists public.user_permissions_permission_id_idx;
drop index if exists public.user_roles_role_id_idx;
drop index if exists public.site_settings_updated_by_idx;
drop index if exists public.posts_user_id_idx;
