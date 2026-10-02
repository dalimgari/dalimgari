-- Avoid SELECT policy overlap: management policies only cover mutations.
drop policy if exists global_ui_labels_admin_write on public.global_ui_labels;
create policy global_ui_labels_admin_write on public.global_ui_labels
  for insert to authenticated
  with check (private.has_permission('settings_manage'));
create policy global_ui_labels_admin_update on public.global_ui_labels
  for update to authenticated
  using (private.has_permission('settings_manage'))
  with check (private.has_permission('settings_manage'));
create policy global_ui_labels_admin_delete on public.global_ui_labels
  for delete to authenticated
  using (private.has_permission('settings_manage'));

drop policy if exists homepage_settings_manage on public.homepage_settings;
create policy homepage_settings_manage on public.homepage_settings
  for insert to authenticated
  with check (private.has_permission('homepage_manage'));
create policy homepage_settings_manage_update on public.homepage_settings
  for update to authenticated
  using (private.has_permission('homepage_manage'))
  with check (private.has_permission('homepage_manage'));
create policy homepage_settings_manage_delete on public.homepage_settings
  for delete to authenticated
  using (private.has_permission('homepage_manage'));

drop policy if exists "sidebar settings manage" on public.sidebar_settings;
create policy "sidebar settings insert" on public.sidebar_settings
  for insert to authenticated
  with check (private.has_permission('sidebar_manage'));
create policy "sidebar settings update" on public.sidebar_settings
  for update to authenticated
  using (private.has_permission('sidebar_manage'))
  with check (private.has_permission('sidebar_manage'));
create policy "sidebar settings delete" on public.sidebar_settings
  for delete to authenticated
  using (private.has_permission('sidebar_manage'));

drop policy if exists theme_settings_admin_write on public.theme_settings;
create policy theme_settings_admin_insert on public.theme_settings
  for insert to authenticated
  with check (private.has_permission('settings_manage'));
create policy theme_settings_admin_update on public.theme_settings
  for update to authenticated
  using (private.has_permission('settings_manage'))
  with check (private.has_permission('settings_manage'));
create policy theme_settings_admin_delete on public.theme_settings
  for delete to authenticated
  using (private.has_permission('settings_manage'));

drop policy if exists "roles admin write" on public.roles;
create policy "roles admin insert" on public.roles for insert to authenticated with check (private.has_permission('user_manage'));
create policy "roles admin update" on public.roles for update to authenticated using (private.has_permission('user_manage')) with check (private.has_permission('user_manage'));
create policy "roles admin delete" on public.roles for delete to authenticated using (private.has_permission('user_manage'));

drop policy if exists "permissions admin write" on public.permissions;
create policy "permissions admin insert" on public.permissions for insert to authenticated with check (private.has_permission('user_manage'));
create policy "permissions admin update" on public.permissions for update to authenticated using (private.has_permission('user_manage')) with check (private.has_permission('user_manage'));
create policy "permissions admin delete" on public.permissions for delete to authenticated using (private.has_permission('user_manage'));

drop policy if exists "role_permissions admin write" on public.role_permissions;
create policy "role_permissions admin insert" on public.role_permissions for insert to authenticated with check (private.has_permission('user_manage'));
create policy "role_permissions admin update" on public.role_permissions for update to authenticated using (private.has_permission('user_manage')) with check (private.has_permission('user_manage'));
create policy "role_permissions admin delete" on public.role_permissions for delete to authenticated using (private.has_permission('user_manage'));