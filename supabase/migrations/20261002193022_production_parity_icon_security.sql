-- Production parity and security hardening for icon management.
create table if not exists public.icon_management (
  icon_management_id uuid primary key default gen_random_uuid(),
  key text not null unique,
  icon_name text,
  icon_library text not null default 'lucide',
  source_url text,
  storage_path text,
  icon_url text,
  mime_type text not null default 'image/svg+xml',
  source text,
  file_type text,
  file_size bigint,
  status text not null default 'pending'
    check (status in ('pending', 'downloaded', 'failed', 'disabled')),
  auto_resolved boolean not null default false,
  scan_sources text[] not null default '{}',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.icon_management enable row level security;
create index if not exists idx_icon_management_key on public.icon_management(key);
create index if not exists idx_icon_management_status on public.icon_management(status);
grant select on public.icon_management to anon, authenticated;
grant insert, update, delete on public.icon_management to authenticated;
drop policy if exists "icon management public read" on public.icon_management;
create policy "icon management public read" on public.icon_management for select to public using (true);
drop policy if exists "icon management write with permission" on public.icon_management;
create policy "icon management write with permission" on public.icon_management for all to authenticated using (public.current_user_has_permission('settings_manage')) with check (public.current_user_has_permission('settings_manage'));
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-icons','site-icons',true,1048576,array['image/svg+xml','image/png','image/webp']::text[])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "site icons public read" on storage.objects;
create policy "site icons public read" on storage.objects for select to public using (bucket_id='site-icons');
drop policy if exists "site icons upload with permission" on storage.objects;
create policy "site icons upload with permission" on storage.objects for insert to authenticated with check (bucket_id='site-icons' and public.current_user_has_permission('settings_manage') and lower(storage.extension(name)) in ('svg','png','webp'));
drop policy if exists "site icons update with permission" on storage.objects;
create policy "site icons update with permission" on storage.objects for update to authenticated using (bucket_id='site-icons' and public.current_user_has_permission('settings_manage')) with check (bucket_id='site-icons' and public.current_user_has_permission('settings_manage'));
drop policy if exists "site icons delete with permission" on storage.objects;
create policy "site icons delete with permission" on storage.objects for delete to authenticated using (bucket_id='site-icons' and public.current_user_has_permission('settings_manage'));
revoke execute on function public.current_user_has_admin_access() from anon;
revoke execute on function public.current_user_has_permission(text) from anon;