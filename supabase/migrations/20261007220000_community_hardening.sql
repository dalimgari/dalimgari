-- Community platform hardening and performance.
create index if not exists comments_user_idx on public.comments(user_id);
create index if not exists post_reactions_user_idx on public.post_reactions(user_id);
create index if not exists event_rsvps_event_idx on public.event_rsvps(event_id);
create index if not exists event_rsvps_user_idx on public.event_rsvps(user_id);
create index if not exists reports_reporter_idx on public.reports(reporter_id);
create index if not exists reports_status_idx on public.reports(status);
create index if not exists post_media_media_idx on public.post_media(media_id);
create index if not exists media_created_idx on public."Media"(created_at desc);
create index if not exists media_album_created_idx on public."Media"(album_id, created_at desc);
create index if not exists album_user_idx on public."Album"(user_id);

insert into public.theme_presets (key,name,description,tokens,is_active)
values
('classic','Classic','Clean community default','{"primary":"#2563eb","accent":"#0f766e","surface":"#ffffff","surface2":"#f8fafc","bg":"#f1f5f9","text":"#0f172a","muted":"#64748b","border":"#dbe2ea"}',true),
('modern','Modern','Soft modern interface','{"primary":"#7c3aed","accent":"#db2777","surface":"#ffffff","surface2":"#faf5ff","bg":"#f5f3ff","text":"#18181b","muted":"#71717a","border":"#e4e4e7"}',true),
('future','Future','High contrast technology style','{"primary":"#06b6d4","accent":"#22c55e","surface":"#0f172a","surface2":"#111827","bg":"#020617","text":"#f8fafc","muted":"#94a3b8","border":"#334155"}',true)
on conflict (key) do update set name=excluded.name,description=excluded.description,tokens=excluded.tokens,is_active=true,updated_at=now();

insert into public.platform_options(key,value)
values ('theme_presets','["classic","modern","future"]')
on conflict (key) do update set value=excluded.value,updated_at=now();

drop policy if exists "community media authenticated upload" on storage.objects;
create policy "community media authenticated upload" on storage.objects for insert to authenticated
with check (bucket_id='community-media' and (storage.foldername(name))[1]=(select auth.uid()::text));
drop policy if exists "community media owner update" on storage.objects;
create policy "community media owner update" on storage.objects for update to authenticated
using (bucket_id='community-media' and owner_id=(select auth.uid()::text))
with check (bucket_id='community-media' and owner_id=(select auth.uid()::text));
drop policy if exists "community media owner delete" on storage.objects;
create policy "community media owner delete" on storage.objects for delete to authenticated
using (bucket_id='community-media' and owner_id=(select auth.uid()::text));
