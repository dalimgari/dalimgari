create or replace function private.has_permission(required_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    exists (
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

create or replace function public.current_user_has_permission(required_permission text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.has_permission(required_permission);
$function$;

create or replace function public.can_access_route(requested_path text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $function$
  select coalesce((
    select case
      when not sr.is_active then false
      when sr.requires_login and (select auth.uid()) is null then false
      when sr.required_permission is null then true
      else private.has_permission(sr.required_permission)
    end
    from public.site_routes sr
    where sr.path = requested_path
    limit 1
  ), false);
$function$;

grant execute on function public.current_user_has_permission(text) to anon, authenticated;
grant execute on function public.can_access_route(text) to anon, authenticated;