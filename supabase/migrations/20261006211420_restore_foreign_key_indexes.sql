-- Keep covering indexes for foreign-key columns.
-- These indexes are intentionally retained even when current workload usage is low,
-- because removing them leaves the foreign keys unindexed.
create index if not exists posts_user_id_idx on public.posts (user_id);
create index if not exists role_permissions_permission_id_idx on public.role_permissions (permission_id);
create index if not exists user_permissions_permission_id_idx on public.user_permissions (permission_id);
create index if not exists user_roles_role_id_idx on public.user_roles (role_id);
create index if not exists site_settings_updated_by_idx on public.site_settings (updated_by);
