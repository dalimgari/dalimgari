-- Media Library: public URLs with admin-only upload and metadata management.
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) > 0),
  original_filename text not null,
  storage_path text not null unique,
  public_url text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.media_assets enable row level security;
grant select, insert, update, delete on public.media_assets to authenticated;

drop policy if exists "Admins manage media assets" on public.media_assets;
create policy "Admins manage media assets"
on public.media_assets
for all
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media-library',
  'media-library',
  true,
  52428800,
  array[
    'image/jpeg','image/png','image/webp','image/gif','image/avif','image/svg+xml',
    'video/mp4','video/webm','video/quicktime',
    'audio/mpeg','audio/mp4','audio/wav','audio/ogg',
    'application/pdf'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins upload media library files" on storage.objects;
create policy "Admins upload media library files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'media-library'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Admins update media library files" on storage.objects;
create policy "Admins update media library files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'media-library'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
)
with check (
  bucket_id = 'media-library'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Admins delete media library files" on storage.objects;
create policy "Admins delete media library files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'media-library'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);
