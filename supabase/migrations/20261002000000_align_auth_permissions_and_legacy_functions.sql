begin;

-- Align authorization keys with the permissions actually used by the current application.
create or replace function public.assign_user_role(target_profile_id uuid, target_role_key text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role_id uuid;
begin
  if not public.current_user_has_permission('user_manage') then
    raise exception 'Permission denied';
  end if;

  select role_id into target_role_id
  from public.roles
  where role_key = target_role_key and is_active = true;

  if target_role_id is null then
    raise exception 'Role not found';
  end if;

  update public.user_roles
     set role_id = target_role_id,
         assigned_by = auth.uid(),
         assigned_at = now()
   where profile_id = target_profile_id;

  if not found then
    insert into public.user_roles(profile_id, role_id, assigned_by)
    values (target_profile_id, target_role_id, auth.uid());
  end if;

  return true;
end;
$$;

-- Current schema stores administrator state in profiles/user_roles; remove stale references
-- to the retired UserInformation table and retired account_type column.
create or replace function private.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.profiles p
    where p.profile_id = (select auth.uid())
      and p.is_active = true
      and p.is_protected = true
  );
$$;

create or replace function public.is_current_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.profile_id = (select auth.uid())
      and p.is_active = true
      and p.is_protected = true
  );
$$;

create or replace function public.current_user_has_admin_access()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.user_roles ur on ur.profile_id = p.profile_id
    join public.roles r on r.role_id = ur.role_id
    join public.role_permissions rp on rp.role_id = r.role_id
    join public.permissions perm on perm.permission_id = rp.permission_id
    where p.profile_id = (select auth.uid())
      and p.is_active = true
      and r.is_active = true
      and perm.is_active = true
      and perm.permission_key in (
        'user_manage',
        'content_manage',
        'media_manage',
        'settings_manage',
        'homepage_manage',
        'sidebar_manage',
        'audit_view'
      )
  );
$$;

-- Restrict SECURITY DEFINER entry points to the roles that need them.
revoke execute on function public.assign_user_role(uuid, text) from public;
grant execute on function public.assign_user_role(uuid, text) to authenticated;

revoke execute on function public.get_manageable_users() from public;
grant execute on function public.get_manageable_users() to authenticated;

revoke execute on function public.record_analytics_visit(text, text, text, text, text, text, text) from public;
grant execute on function public.record_analytics_visit(text, text, text, text, text, text, text) to anon, authenticated;

commit;
