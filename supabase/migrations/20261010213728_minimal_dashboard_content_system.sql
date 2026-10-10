create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, phone text, date_of_birth date, bio text, avatar_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
grant select, insert, update on public.profiles to authenticated;
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles for select to authenticated
using (id = (select auth.uid()) or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create or replace function public.sync_auth_user_profile()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, created_at, updated_at)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name',''), nullif(new.raw_user_meta_data->>'name','')), now(), now())
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users for each row execute function public.sync_auth_user_profile();
insert into public.profiles (id, full_name)
select id, coalesce(nullif(raw_user_meta_data->>'full_name',''), nullif(raw_user_meta_data->>'name','')) from auth.users
on conflict (id) do nothing;

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  description text, url text not null unique, cover_path text,
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.post (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 240),
  caption text, description text, url text not null unique, content text,
  media jsonb not null default '[]'::jsonb check (jsonb_typeof(media) = 'array'),
  album_id uuid references public.albums(id) on delete set null,
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 240),
  description text, url text not null unique, content text not null default '',
  media jsonb not null default '[]'::jsonb check (jsonb_typeof(media) = 'array'),
  album_id uuid references public.albums(id) on delete set null,
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.hero_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 240),
  description text, url text, content text,
  media jsonb not null default '[]'::jsonb check (jsonb_typeof(media) = 'array'),
  album_id uuid references public.albums(id) on delete set null,
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) between 1 and 80),
  description text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) between 1 and 120),
  description text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);
create table if not exists public.site_customizations (
  id uuid primary key default gen_random_uuid(), key text not null unique,
  value jsonb not null default '{}'::jsonb, description text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(), key text not null unique,
  value jsonb not null default '{}'::jsonb, description text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.recycle_bin (
  id uuid primary key default gen_random_uuid(),
  original_table text not null check (original_table in ('post','pages','hero_items','albums','roles','permissions','site_customizations','site_settings')),
  original_id text not null, record_data jsonb not null, related_data jsonb not null default '{}'::jsonb,
  deleted_by uuid references auth.users(id) on delete set null,
  deleted_at timestamptz not null default now(), purge_after timestamptz not null default (now() + interval '30 days')
);

alter table public.albums enable row level security;
alter table public.post enable row level security;
alter table public.pages enable row level security;
alter table public.hero_items enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.site_customizations enable row level security;
alter table public.site_settings enable row level security;
alter table public.recycle_bin enable row level security;

grant select on public.albums, public.post, public.pages, public.hero_items to anon, authenticated;
grant insert, update, delete on public.albums, public.post, public.pages, public.hero_items to authenticated;
grant select, insert, update, delete on public.roles, public.permissions, public.user_roles, public.role_permissions, public.site_customizations, public.site_settings, public.recycle_bin to authenticated;

drop policy if exists content_public_read on public.albums;
create policy content_public_read on public.albums for select to anon, authenticated
using (visibility = 'public' or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists content_admin_write on public.albums;
create policy content_admin_write on public.albums for all to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin') with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists content_public_read on public.post;
create policy content_public_read on public.post for select to anon, authenticated
using (visibility = 'public' or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists content_admin_write on public.post;
create policy content_admin_write on public.post for all to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin') with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists content_public_read on public.pages;
create policy content_public_read on public.pages for select to anon, authenticated
using (visibility = 'public' or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists content_admin_write on public.pages;
create policy content_admin_write on public.pages for all to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin') with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists content_public_read on public.hero_items;
create policy content_public_read on public.hero_items for select to anon, authenticated
using (visibility = 'public' or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists content_admin_write on public.hero_items;
create policy content_admin_write on public.hero_items for all to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin') with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

do $$
declare t text;
begin
  foreach t in array array['roles','permissions','user_roles','role_permissions','site_customizations','site_settings','recycle_bin'] loop
    execute format('drop policy if exists admin_only_all on public.%I', t);
    execute format('create policy admin_only_all on public.%I for all to authenticated using (((select auth.jwt()) -> ''app_metadata'' ->> ''role'') = ''admin'') with check (((select auth.jwt()) -> ''app_metadata'' ->> ''role'') = ''admin'')', t);
  end loop;
end $$;

insert into public.permissions(name,description) values
('content.view','View content'),('content.create','Create content'),('content.edit','Edit content'),('content.delete','Delete content'),
('users.manage','Manage users'),('roles.manage','Manage roles'),('settings.manage','Manage settings')
on conflict (name) do nothing;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('content-files','content-files',false,52428800,array[
'image/jpeg','image/png','image/webp','image/gif','image/avif','image/svg+xml',
'video/mp4','video/webm','video/quicktime','audio/mpeg','audio/mp4','audio/wav','audio/ogg','application/pdf'
])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists content_files_admin_insert on storage.objects;
create policy content_files_admin_insert on storage.objects for insert to authenticated
with check (bucket_id='content-files' and ((select auth.jwt()) -> 'app_metadata' ->> 'role')='admin');
drop policy if exists content_files_admin_update on storage.objects;
create policy content_files_admin_update on storage.objects for update to authenticated
using (bucket_id='content-files' and ((select auth.jwt()) -> 'app_metadata' ->> 'role')='admin')
with check (bucket_id='content-files' and ((select auth.jwt()) -> 'app_metadata' ->> 'role')='admin');
drop policy if exists content_files_admin_delete on storage.objects;
create policy content_files_admin_delete on storage.objects for delete to authenticated
using (bucket_id='content-files' and ((select auth.jwt()) -> 'app_metadata' ->> 'role')='admin');
drop policy if exists content_files_admin_select on storage.objects;
create policy content_files_admin_select on storage.objects for select to authenticated
using (bucket_id='content-files' and ((select auth.jwt()) -> 'app_metadata' ->> 'role')='admin');
