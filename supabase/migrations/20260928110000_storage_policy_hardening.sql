drop policy if exists "Authenticated users can upload media"
on storage.objects;

drop policy if exists "Authenticated users can update media"
on storage.objects;

drop policy if exists "Authenticated users can delete media"
on storage.objects;

drop policy if exists "Admins and permitted users can upload media"
on storage.objects;

drop policy if exists "Admins and permitted users can update media"
on storage.objects;

drop policy if exists "Admins and permitted users can delete media"
on storage.objects;

create policy "Admins and permitted users can upload media"
on storage.objects
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  )
  or exists (
    select 1
    from public.user_permissions
    where user_id = auth.uid()
      and permission = 'media.upload'
  )
);

create policy "Admins and permitted users can update media"
on storage.objects
for update
to authenticated
using (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  )
  or exists (
    select 1
    from public.user_permissions
    where user_id = auth.uid()
      and permission = 'media.update'
  )
)
with check (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  )
  or exists (
    select 1
    from public.user_permissions
    where user_id = auth.uid()
      and permission = 'media.update'
  )
);

create policy "Admins and permitted users can delete media"
on storage.objects
for delete
to authenticated
using (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  )
  or exists (
    select 1
    from public.user_permissions
    where user_id = auth.uid()
      and permission = 'media.delete'
  )
);
