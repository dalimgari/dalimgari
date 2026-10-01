-- Keep the admin access helper self-contained and safe from search_path shadowing.

create or replace function public.current_user_has_admin_access()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.permission_id = rp.permission_id
    join public.profiles pr on pr.profile_id = ur.profile_id
    where ur.profile_id = (select auth.uid())
      and pr.is_active = true
      and p.is_active = true
      and p.permission_key in (
        'permission_manage',
        'content_manage',
        'media_manage',
        'user_manage',
        'settings_manage',
        'analytics_view',
        'audit_view'
      )
  );
$$;

revoke all on function public.current_user_has_admin_access() from public;
grant execute on function public.current_user_has_admin_access() to authenticated;
