-- Dalimgari Website: Supabase Storage + Media Security Foundation
-- Bucket: media (public read, permission-controlled mutations)
-- Public access is intentional for published website media.
-- Upload/update/delete require the media_manage permission.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "media_upload_with_permission" on storage.objects;
drop policy if exists "media_update_with_permission" on storage.objects;
drop policy if exists "media_delete_with_permission" on storage.objects;

create policy "media_upload_with_permission"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'media'
  and public.current_user_has_permission('media_manage')
);

create policy "media_update_with_permission"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'media'
  and public.current_user_has_permission('media_manage')
)
with check (
  bucket_id = 'media'
  and public.current_user_has_permission('media_manage')
);

create policy "media_delete_with_permission"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'media'
  and public.current_user_has_permission('media_manage')
);
