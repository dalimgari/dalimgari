-- Align frontend management routes with the authoritative route-permission table.
-- Additive and idempotent: existing rows are updated only to the defined route metadata.

insert into public.site_routes (
  route_key,
  path,
  page_name,
  page_type,
  is_active,
  requires_login,
  required_permission,
  fallback_enabled
)
values
  (
    'manage-translation-overrides',
    '/manage/translation-overrides',
    'Translation Overrides',
    'management',
    true,
    true,
    'settings_manage',
    true
  ),
  (
    'manage-icons',
    '/manage/icons',
    'Icon Management',
    'management',
    true,
    true,
    'settings_manage',
    true
  )
on conflict (route_key) do update
set
  path = excluded.path,
  page_name = excluded.page_name,
  page_type = excluded.page_type,
  is_active = excluded.is_active,
  requires_login = excluded.requires_login,
  required_permission = excluded.required_permission,
  fallback_enabled = excluded.fallback_enabled,
  updated_at = now();
