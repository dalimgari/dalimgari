drop policy if exists admin_full_access_all_storage_objects on storage.objects;
drop policy if exists content_files_admin_select on storage.objects;
drop policy if exists content_files_admin_insert on storage.objects;
drop policy if exists content_files_admin_update on storage.objects;
drop policy if exists content_files_admin_delete on storage.objects;
drop policy if exists content_files_role_select on storage.objects;
drop policy if exists content_files_role_insert on storage.objects;
drop policy if exists content_files_role_update on storage.objects;
drop policy if exists content_files_role_delete on storage.objects;

create policy admin_full_access_all_storage_objects
on storage.objects
for all
to authenticated
using (
  (
    bucket_id <> 'content-files'
    and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  )
  or (
    bucket_id = 'content-files'
    and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    and (
      (storage.foldername(name))[1] = 'public'
      or (
        (storage.foldername(name))[1] = 'private'
        and (storage.foldername(name))[2] = (select auth.uid())::text
      )
    )
  )
)
with check (
  (
    bucket_id <> 'content-files'
    and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  )
  or (
    bucket_id = 'content-files'
    and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    and (
      (storage.foldername(name))[1] = 'public'
      or (
        (storage.foldername(name))[1] = 'private'
        and (storage.foldername(name))[2] = (select auth.uid())::text
      )
    )
  )
);
