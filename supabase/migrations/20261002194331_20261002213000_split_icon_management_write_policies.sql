drop policy if exists "icon management insert with permission" on public.icon_management;
drop policy if exists "icon management update with permission" on public.icon_management;
drop policy if exists "icon management delete with permission" on public.icon_management;
drop policy if exists "icon management write with permission" on public.icon_management;

create policy "icon management insert with permission" on public.icon_management
for insert to authenticated
with check ((select public.current_user_has_permission('settings_manage')));

create policy "icon management update with permission" on public.icon_management
for update to authenticated
using ((select public.current_user_has_permission('settings_manage')))
with check ((select public.current_user_has_permission('settings_manage')));

create policy "icon management delete with permission" on public.icon_management
for delete to authenticated
using ((select public.current_user_has_permission('settings_manage')));