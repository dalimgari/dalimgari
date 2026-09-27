create policy "Public can view media"
on storage.objects
for select
to public
using (bucket_id = 'media');

create policy "Authenticated users can upload media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'media');

create policy "Authenticated users can update media"
on storage.objects
for update
to authenticated
using (bucket_id = 'media')
with check (bucket_id = 'media');

create policy "Authenticated users can delete media"
on storage.objects
for delete
to authenticated
using (bucket_id = 'media');
