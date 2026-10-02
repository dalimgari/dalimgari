-- Avoid overlapping permissive icon-management SELECT policies.
drop policy if exists "icon management public read" on public.icon_management;
drop policy if exists "icon management write with permission" on public.icon_management;

create policy "icon management public read"
on public.icon_management
for select
to anon, authenticated
using (true);

create policy "icon management write with permission"
on public.icon_management
for all
to authenticated
using ((select public.current_user_has_permission('settings_manage')))
with check ((select public.current_user_has_permission('settings_manage')));
