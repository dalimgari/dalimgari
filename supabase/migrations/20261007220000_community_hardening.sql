-- Community platform hardening and performance.
create index if not exists comments_user_idx on public.comments(user_id);
create index if not exists post_reactions_user_idx on public.post_reactions(user_id);
create index if not exists event_rsvps_event_idx on public.event_rsvps(event_id);
create index if not exists event_rsvps_user_idx on public.event_rsvps(user_id);
create index if not exists reports_reporter_idx on public.reports(reporter_id);
create index if not exists reports_status_idx on public.reports(status);
create index if not exists post_media_media_idx on public.post_media(media_id);
create index if not exists media_created_idx on public."Media"(created_at desc);
create index if not exists announcements_author_idx on public.announcements(author_id);
create index if not exists events_creator_idx on public.events(creator_id);
create index if not exists reports_comment_idx on public.reports(comment_id);
create index if not exists reports_post_idx on public.reports(post_id);

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

drop policy if exists post_media_delete_own on public.post_media;
create policy post_media_delete_own on public.post_media for delete to authenticated
using (exists(select 1 from public.posts p where p.id=post_media.post_id and p.user_id=(select auth.uid())));

drop policy if exists post_media_insert_own on public.post_media;
create policy post_media_insert_own on public.post_media for insert to authenticated
with check (
  exists(select 1 from public.posts p where p.id=post_media.post_id and p.user_id=(select auth.uid()))
  and exists(select 1 from public."Media" m where m.id=post_media.media_id and m.user_id=(select auth.uid()))
);

drop policy if exists user_preferences_own on public.user_preferences;
create policy user_preferences_own on public.user_preferences for all to authenticated
using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid()));

-- Remove redundant indexes and split admin writes from public reads.
drop index if exists public.media_album_idx;
drop index if exists public.user_role_idx;
drop policy if exists platform_options_admin_write on public.platform_options;
create policy platform_options_admin_insert on public.platform_options for insert to authenticated with check ((select private.is_admin()));
create policy platform_options_admin_update on public.platform_options for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy platform_options_admin_delete on public.platform_options for delete to authenticated using ((select private.is_admin()));
