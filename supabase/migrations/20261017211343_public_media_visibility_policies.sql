create policy media_assets_public_select_anon
on public.media_assets
for select
to anon
using (visibility = 'public');

create policy media_assets_public_select_authenticated
on public.media_assets
for select
to authenticated
using (visibility = 'public');

create policy media_links_public_read
on public.media_links
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.media_assets ma
    where ma.id = media_links.media_id
      and ma.visibility = 'public'
  )
  and (
    (source_table = 'albums' and exists (
      select 1 from public.albums a
      where a.id = media_links.source_id and a.visibility = 'public'
    ))
    or (source_table = 'pages' and exists (
      select 1 from public.pages p
      where p.id = media_links.source_id and p.visibility = 'public'
    ))
    or (source_table = 'post' and exists (
      select 1 from public.post p
      where p.id = media_links.source_id and p.visibility = 'public'
    ))
    or (source_table = 'hero_items' and exists (
      select 1 from public.hero_items h
      where h.id = media_links.source_id and h.visibility = 'public'
    ))
  )
);
