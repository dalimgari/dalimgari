drop policy media_assets_select on public.media_assets;
create policy media_assets_select
on public.media_assets
for select
to authenticated
using (
  visibility = 'public'
  or created_by = (select auth.uid())
);
