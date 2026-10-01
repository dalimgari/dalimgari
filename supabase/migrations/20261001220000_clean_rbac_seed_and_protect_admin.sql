-- Keep the RBAC schema but do not ship sample application data.
-- Only the existing protected administrator may remain assigned.

-- Remove non-protected user-role assignments first because user_roles references roles with RESTRICT.
delete from public.user_roles ur
using public.profiles p
where p.profile_id = ur.profile_id
  and p.is_protected = false;

-- Remove all non-admin roles. The Admin role is kept as the protected administrator's role.
delete from public.user_roles ur
where ur.role_id in (
  select role_id from public.roles where role_key <> 'admin'
);

delete from public.roles where role_key <> 'admin';

-- Permissions are intentionally empty; they can be created later from the database.
delete from public.role_permissions;
delete from public.permissions;

-- Do not auto-assign a sample "user" role to future accounts.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(profile_id,email,phone,display_name)
  values(new.id,new.email,new.phone,coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name'))
  on conflict(profile_id) do update set
    email=excluded.email,
    phone=excluded.phone,
    display_name=coalesce(excluded.display_name,public.profiles.display_name),
    updated_at=now();
  return new;
end;
$$;

-- Authorization must remain database-driven. A protected active profile is always allowed;
-- other users require an active role/permission assignment.
create or replace function public.current_user_has_permission(required_permission text)
returns boolean
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  allowed boolean;
begin
  if auth.uid() is null then
    return false;
  end if;

  select exists (
    select 1
    from public.profiles p
    where p.profile_id = (select auth.uid())
      and p.is_active = true
      and p.is_protected = true
  ) into allowed;

  if allowed then
    return true;
  end if;

  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.role_id = ur.role_id
    join public.role_permissions rp on rp.role_id = r.role_id
    join public.permissions p on p.permission_id = rp.permission_id
    join public.profiles pr on pr.profile_id = ur.profile_id
    where ur.profile_id = (select auth.uid())
      and pr.is_active = true
      and r.is_active = true
      and p.is_active = true
      and p.permission_key = required_permission
  ) into allowed;

  return allowed;
end;
$$;

revoke all on function public.current_user_has_permission(text) from public;
grant execute on function public.current_user_has_permission(text) to authenticated;
