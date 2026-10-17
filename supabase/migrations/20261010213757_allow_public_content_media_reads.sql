drop policy if exists content_files_public_select on storage.objects;
create policy content_files_public_select on storage.objects for select to anon, authenticated
using (bucket_id='content-files' and (storage.foldername(name))[1]='public');
