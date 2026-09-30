alter table public.profiles
  add column if not exists is_super_admin boolean not null default false;

update public.profiles
set is_super_admin = true
where profile_id = '4ce2472e-1e60-4c4d-83e0-3235d34208ba';

create or replace function public.current_user_has_permission(required_permission text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.permission_id = rp.permission_id
    join public.profiles pr on pr.profile_id = ur.profile_id
    where ur.profile_id = auth.uid()
      and pr.is_active = true
      and p.permission_key = required_permission
  );
$$;

drop policy if exists user_roles_select_self_or_admin on public.user_roles;
create policy user_roles_select_self_or_manager
on public.user_roles
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or private.has_permission('permission_manage')
  or private.has_permission('user_manage')
);
