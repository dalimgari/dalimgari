-- Harden the public media bucket while preserving public object URLs.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/*',
      'video/*',
      'audio/*',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
where id = 'media';

-- Keep Storage mutations permission-gated and explicitly authenticated.
drop policy if exists "media_upload_with_permission" on storage.objects;
drop policy if exists "media_update_with_permission" on storage.objects;
drop policy if exists "media_delete_with_permission" on storage.objects;

create policy "media_upload_with_permission"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'media'
  and current_user_has_permission('media_manage')
);

create policy "media_update_with_permission"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'media'
  and current_user_has_permission('media_manage')
)
with check (
  bucket_id = 'media'
  and current_user_has_permission('media_manage')
);

create policy "media_delete_with_permission"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'media'
  and current_user_has_permission('media_manage')
);