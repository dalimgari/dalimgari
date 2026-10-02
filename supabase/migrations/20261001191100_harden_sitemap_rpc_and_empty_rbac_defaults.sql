revoke execute on function public.get_sitemap_content() from authenticated;
revoke execute on function public.get_sitemap_content() from public;
grant execute on function public.get_sitemap_content() to anon;

create or replace function public.current_user_has_permission(required_permission text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  result boolean := false;
begin
  if auth.uid() is null then return false; end if;
  select exists (
    select 1 from public.profiles p
    where p.profile_id = auth.uid()
      and p.is_active = true
      and p.is_protected = true
  ) into result;
  if result then return true; end if;
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.role_id = ur.role_id
    join public.role_permissions rp on rp.role_id = r.role_id
    join public.permissions perm on perm.permission_id = rp.permission_id
    where ur.profile_id = auth.uid()
      and r.is_active = true
      and perm.is_active = true
      and perm.permission_key = required_permission
  ) into result;
  return result;
end;
$$;
revoke execute on function public.current_user_has_permission(text) from public;
grant execute on function public.current_user_has_permission(text) to authenticated;