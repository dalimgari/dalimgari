create or replace function private.current_user_has_permission(required_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select case
    when exists (
      select 1 from public.profiles p
      join public.user_roles ur on ur.profile_id = p.profile_id
      join public.roles r on r.role_id = ur.role_id
      where p.profile_id = (select auth.uid()) and p.is_active = true
        and r.is_active = true and lower(r.role_key) = 'admin'
    ) then true
    else private.has_permission(required_permission)
  end;
$function$;

create or replace function private.current_user_has_admin_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1 from public.profiles p
    join public.user_roles ur on ur.profile_id = p.profile_id
    join public.roles r on r.role_id = ur.role_id
    where p.profile_id = (select auth.uid()) and p.is_active = true
      and r.is_active = true and lower(r.role_key) = 'admin'
  );
$function$;

revoke execute on function private.current_user_has_permission(text) from public, anon;
revoke execute on function private.current_user_has_admin_access() from public, anon;
grant execute on function private.current_user_has_permission(text) to authenticated;
grant execute on function private.current_user_has_admin_access() to authenticated;
grant usage on schema private to authenticated;

create or replace function public.current_user_has_permission(required_permission text)
returns boolean language sql stable set search_path = ''
as $function$ select private.current_user_has_permission(required_permission); $function$;

create or replace function public.current_user_has_admin_access()
returns boolean language sql stable set search_path = ''
as $function$ select private.current_user_has_admin_access(); $function$;

revoke execute on function public.current_user_has_permission(text) from public, anon;
revoke execute on function public.current_user_has_admin_access() from public, anon;
grant execute on function public.current_user_has_permission(text) to authenticated;
grant execute on function public.current_user_has_admin_access() to authenticated;