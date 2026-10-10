-- Public media upload page using Supabase anonymous sessions.
-- Anonymous sign-ins must be enabled in Supabase Auth settings for visitors without accounts.

create table if not exists public.public_media_uploads (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  original_filename text not null,
  storage_path text not null unique,
  public_url text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now()
);

alter table public.public_media_uploads enable row level security;
grant insert on public.public_media_uploads to anon, authenticated;
grant select, delete on public.public_media_uploads to authenticated;

drop policy if exists public_media_submit_anonymous_session on public.public_media_uploads;
create policy public_media_submit_anonymous_session
on public.public_media_uploads for insert to authenticated
with check (
  (
    (select auth.jwt()) ->> 'is_anonymous' = 'true'
    or (select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin'
  )
  and char_length(btrim(title)) between 1 and 160
  and size_bytes > 0 and size_bytes <= 10485760
  and storage_path like '%/uploads/%'
);

drop policy if exists public_media_admin_select on public.public_media_uploads;
create policy public_media_admin_select
on public.public_media_uploads for select to authenticated
using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists public_media_admin_delete on public.public_media_uploads;
create policy public_media_admin_delete
on public.public_media_uploads for delete to authenticated
using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-media-inbox',
  'public-media-inbox',
  true,
  10485760,
  array[
    'image/jpeg','image/png','image/webp','image/gif','image/avif','image/svg+xml',
    'video/mp4','video/webm','video/quicktime',
    'audio/mpeg','audio/mp4','audio/wav','audio/ogg','application/pdf'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists public_media_upload_anon_session on storage.objects;
create policy public_media_upload_anon_session
on storage.objects for insert to authenticated
with check (
  bucket_id = 'public-media-inbox'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (
    (select auth.jwt()) ->> 'is_anonymous' = 'true'
    or (select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin'
  )
);

drop policy if exists public_media_delete_own_anonymous_upload on storage.objects;
create policy public_media_delete_own_anonymous_upload
on storage.objects for delete to authenticated
using (
  bucket_id = 'public-media-inbox'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select auth.jwt()) ->> 'is_anonymous' = 'true'
);

drop policy if exists public_media_admin_delete on storage.objects;
create policy public_media_admin_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'public-media-inbox'
  and (select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin'
);
