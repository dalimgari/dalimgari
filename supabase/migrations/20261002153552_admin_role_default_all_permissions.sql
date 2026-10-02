create or replace function public.current_user_has_permission(required_permission text)
returns boolean
language sql
security definer
set search_path = public, private
as $$
  select case
    when exists (
      select 1
      from public.profiles p
      join public.user_roles ur on ur.profile_id = p.profile_id
      join public.roles r on r.role_id = ur.role_id
      where p.profile_id = (select auth.uid())
        and p.is_active = true
        and r.is_active = true
        and lower(r.role_key) = 'admin'
    ) then true
    else private.has_permission(required_permission)
  end;
$$;

create or replace function public.current_user_has_admin_access()
returns boolean
language sql
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.profiles p
    join public.user_roles ur on ur.profile_id = p.profile_id
    join public.roles r on r.role_id = ur.role_id
    where p.profile_id = (select auth.uid())
      and p.is_active = true
      and r.is_active = true
      and lower(r.role_key) = 'admin'
  );
$$;