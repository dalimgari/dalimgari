drop policy if exists translation_overrides_public_read on public.translation_overrides;
drop policy if exists translation_overrides_admin_insert on public.translation_overrides;
drop policy if exists translation_overrides_admin_update on public.translation_overrides;
drop policy if exists translation_overrides_admin_delete on public.translation_overrides;

create policy translation_overrides_public_select
on public.translation_overrides
for select
to public
using (true);

create policy translation_overrides_public_insert
on public.translation_overrides
for insert
to public
with check (true);

create policy translation_overrides_public_update
on public.translation_overrides
for update
to public
using (true)
with check (true);

create policy translation_overrides_public_delete
on public.translation_overrides
for delete
to public
using (true);

grant select, insert, update, delete on public.translation_overrides to anon, authenticated;