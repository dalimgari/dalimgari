create or replace function private.has_permission(required_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    (
      (select auth.uid()) is null
      and exists (
        select 1
        from public.roles r
        join public.role_permissions rp on rp.role_id = r.role_id
        join public.permissions p on p.permission_id = rp.permission_id
        where r.role_key = 'visitor'
          and r.is_active = true
          and p.permission_key = required_permission
          and p.is_active = true
      )
    )
    or exists (
      select 1
      from public.profiles pr
      where pr.profile_id = (select auth.uid())
        and pr.is_active = true
        and pr.is_protected = true
    )
    or exists (
      select 1
      from public.user_roles ur
      join public.role_permissions rp on rp.role_id = ur.role_id
      join public.permissions p on p.permission_id = rp.permission_id
      join public.profiles pr on pr.profile_id = ur.profile_id
      where ur.profile_id = (select auth.uid())
        and pr.is_active = true
        and p.permission_key = required_permission
        and p.is_active = true
    );
$function$;