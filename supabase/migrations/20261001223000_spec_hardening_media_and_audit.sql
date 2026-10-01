-- Dalimgari Master Specification hardening
-- Reproducible production-safe controls for media storage and audit integrity.

begin;

-- Keep the media bucket bounded even if the dashboard configuration is changed.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/*', 'video/*', 'audio/*',
      'application/pdf', 'text/plain', 'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
where id = 'media';

-- Storage object writes must remain permission-gated.
drop policy if exists media_upload_with_permission on storage.objects;
create policy media_upload_with_permission
on storage.objects for insert to authenticated
with check (
  bucket_id = 'media'
  and public.current_user_has_permission('media_manage')
);

drop policy if exists media_update_with_permission on storage.objects;
create policy media_update_with_permission
on storage.objects for update to authenticated
using (
  bucket_id = 'media'
  and public.current_user_has_permission('media_manage')
)
with check (
  bucket_id = 'media'
  and public.current_user_has_permission('media_manage')
);

drop policy if exists media_delete_with_permission on storage.objects;
create policy media_delete_with_permission
on storage.objects for delete to authenticated
using (
  bucket_id = 'media'
  and public.current_user_has_permission('media_manage')
);

-- Public reads are intentional for the public media bucket.
drop policy if exists media_public_read on storage.objects;
create policy media_public_read
on storage.objects for select to public
using (bucket_id = 'media');

commit;
