drop policy if exists "audit_logs_authenticated_insert" on public.audit_logs;
create policy "audit_logs_authenticated_insert"
on public.audit_logs
for insert
to authenticated
with check ((actor_profile_id = (select auth.uid())));

drop policy if exists "profiles self read" on public.profiles;
drop policy if exists "profiles_admin_read" on public.profiles;
create policy "profiles_authenticated_read"
on public.profiles
for select
to authenticated
using (
  (profile_id = (select auth.uid()))
  or private.has_permission('user_manage')
);

drop policy if exists "profiles self update" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_authenticated_update"
on public.profiles
for update
to authenticated
using (
  (profile_id = (select auth.uid()))
  or private.has_permission('user_manage')
)
with check (
  (profile_id = (select auth.uid()))
  or private.has_permission('user_manage')
);

drop policy if exists "user_roles self read" on public.user_roles;
drop policy if exists "user_roles_admin_read" on public.user_roles;
create policy "user_roles_authenticated_read"
on public.user_roles
for select
to authenticated
using (
  (profile_id = (select auth.uid()))
  or private.has_permission('user_manage')
);