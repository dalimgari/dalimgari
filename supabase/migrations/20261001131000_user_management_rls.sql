-- Dalimgari Website: user management RLS
drop policy if exists profiles_admin_read on public.profiles;
create policy profiles_admin_read on public.profiles for select to authenticated using (private.has_permission('user_manage'));
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update to authenticated using (private.has_permission('user_manage')) with check (private.has_permission('user_manage'));
drop policy if exists user_roles_admin_read on public.user_roles;
create policy user_roles_admin_read on public.user_roles for select to authenticated using (private.has_permission('user_manage'));
drop policy if exists user_roles_admin_insert on public.user_roles;
create policy user_roles_admin_insert on public.user_roles for insert to authenticated with check (private.has_permission('user_manage'));
drop policy if exists user_roles_admin_update on public.user_roles;
create policy user_roles_admin_update on public.user_roles for update to authenticated using (private.has_permission('user_manage')) with check (private.has_permission('user_manage'));
drop policy if exists user_roles_admin_delete on public.user_roles;
create policy user_roles_admin_delete on public.user_roles for delete to authenticated using (private.has_permission('user_manage'));
