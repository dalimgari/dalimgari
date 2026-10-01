-- Dalimgari core website database foundation
-- Applied to Supabase project yopfogoyjxwxplnabqii on 2026-10-01.

do $$ begin
  create type public.record_status as enum ('draft','published','archived');
exception when duplicate_object then null;
end $$;

create table public.website_information (
  website_information_id uuid primary key default extensions.gen_random_uuid(),
  village_name text,
  slogan text,
  division text,
  district text,
  upazila_name text,
  union_name text,
  postal_code text,
  population bigint,
  established_date date,
  map_location text,
  copyright_text text not null default '© 2026. All rights reserved.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_information (
  admin_information_id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(profile_id) on delete cascade,
  name text,
  email text,
  phone text,
  bio text,
  link text,
  profile_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pages (
  page_id uuid primary key default extensions.gen_random_uuid(),
  page_key text not null unique,
  page_title text not null,
  page_slug text not null unique,
  content text not null default '',
  status public.record_status not null default 'draft',
  is_visible boolean not null default true,
  created_by uuid references public.profiles(profile_id) on delete set null,
  updated_by uuid references public.profiles(profile_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.albums (
  album_id uuid primary key default extensions.gen_random_uuid(),
  album_key text not null unique,
  title text not null,
  description text,
  is_visible boolean not null default true,
  created_by uuid references public.profiles(profile_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media (
  media_id uuid primary key default extensions.gen_random_uuid(),
  media_key text not null unique,
  media_type text not null,
  file_name text,
  mime_type text,
  file_size bigint,
  storage_path text,
  media_url text,
  album_id uuid references public.albums(album_id) on delete set null,
  is_visible boolean not null default true,
  created_by uuid references public.profiles(profile_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_source_check check (storage_path is not null or media_url is not null)
);

create table public.posts (
  post_id uuid primary key default extensions.gen_random_uuid(),
  post_key text not null unique,
  title text not null,
  description text,
  album_id uuid references public.albums(album_id) on delete set null,
  status public.record_status not null default 'draft',
  is_visible boolean not null default true,
  created_by uuid references public.profiles(profile_id) on delete set null,
  updated_by uuid references public.profiles(profile_id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_media (
  post_media_id uuid primary key default extensions.gen_random_uuid(),
  post_id uuid not null references public.posts(post_id) on delete cascade,
  media_id uuid not null references public.media(media_id) on delete cascade,
  display_order integer not null default 0,
  unique (post_id, media_id)
);

create table public.audit_logs (
  audit_log_id uuid primary key default extensions.gen_random_uuid(),
  actor_profile_id uuid references public.profiles(profile_id) on delete set null,
  action_key text not null,
  module text,
  record_id uuid,
  details jsonb not null default '{}'::jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index if not exists pages_status_visible_idx on public.pages(status,is_visible);
create index if not exists posts_status_visible_idx on public.posts(status,is_visible);
create index if not exists posts_published_at_idx on public.posts(published_at desc);
create index if not exists media_album_id_idx on public.media(album_id);
create index if not exists post_media_post_id_idx on public.post_media(post_id);
create index if not exists post_media_media_id_idx on public.post_media(media_id);
create index if not exists audit_logs_actor_profile_id_idx on public.audit_logs(actor_profile_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists albums_created_by_idx on public.albums(created_by);
create index if not exists media_created_by_idx on public.media(created_by);
create index if not exists pages_created_by_idx on public.pages(created_by);
create index if not exists pages_updated_by_idx on public.pages(updated_by);
create index if not exists posts_album_id_idx on public.posts(album_id);
create index if not exists posts_created_by_idx on public.posts(created_by);
create index if not exists posts_updated_by_idx on public.posts(updated_by);
create index if not exists role_permissions_permission_id_idx on public.role_permissions(permission_id);
create index if not exists user_roles_role_id_idx on public.user_roles(role_id);
create index if not exists user_roles_assigned_by_idx on public.user_roles(assigned_by);

create trigger website_information_set_updated_at before update on public.website_information for each row execute function public.set_updated_at();
create trigger admin_information_set_updated_at before update on public.admin_information for each row execute function public.set_updated_at();
create trigger pages_set_updated_at before update on public.pages for each row execute function public.set_updated_at();
create trigger albums_set_updated_at before update on public.albums for each row execute function public.set_updated_at();
create trigger media_set_updated_at before update on public.media for each row execute function public.set_updated_at();
create trigger posts_set_updated_at before update on public.posts for each row execute function public.set_updated_at();

alter table public.website_information enable row level security;
alter table public.admin_information enable row level security;
alter table public.pages enable row level security;
alter table public.albums enable row level security;
alter table public.media enable row level security;
alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.audit_logs enable row level security;

create policy website_information_public_read on public.website_information
for select to anon, authenticated using (true);
create policy website_information_admin_insert on public.website_information for insert to authenticated
with check (private.has_permission('settings_manage'));
create policy website_information_admin_update on public.website_information for update to authenticated
using (private.has_permission('settings_manage')) with check (private.has_permission('settings_manage'));
create policy website_information_admin_delete on public.website_information for delete to authenticated
using (private.has_permission('settings_manage'));

create policy admin_information_public_read on public.admin_information
for select to anon, authenticated using (true);
create policy admin_information_admin_insert on public.admin_information for insert to authenticated
with check (private.has_permission('settings_manage'));
create policy admin_information_admin_update on public.admin_information for update to authenticated
using (private.has_permission('settings_manage')) with check (private.has_permission('settings_manage'));
create policy admin_information_admin_delete on public.admin_information for delete to authenticated
using (private.has_permission('settings_manage'));

create policy pages_public_read on public.pages
for select to anon, authenticated using (status='published' and is_visible=true);
create policy pages_content_insert on public.pages for insert to authenticated
with check (private.has_permission('content_manage'));
create policy pages_content_update on public.pages for update to authenticated
using (private.has_permission('content_manage')) with check (private.has_permission('content_manage'));
create policy pages_content_delete on public.pages for delete to authenticated
using (private.has_permission('content_manage'));

create policy albums_public_read on public.albums
for select to anon, authenticated using (is_visible=true);
create policy albums_media_insert on public.albums for insert to authenticated
with check (private.has_permission('media_manage'));
create policy albums_media_update on public.albums for update to authenticated
using (private.has_permission('media_manage')) with check (private.has_permission('media_manage'));
create policy albums_media_delete on public.albums for delete to authenticated
using (private.has_permission('media_manage'));

create policy media_public_read on public.media
for select to anon, authenticated using (is_visible=true);
create policy media_insert on public.media for insert to authenticated
with check (private.has_permission('media_manage'));
create policy media_update on public.media for update to authenticated
using (private.has_permission('media_manage')) with check (private.has_permission('media_manage'));
create policy media_delete on public.media for delete to authenticated
using (private.has_permission('media_manage'));

create policy posts_public_read on public.posts
for select to anon, authenticated using (status='published' and is_visible=true);
create policy posts_content_insert on public.posts for insert to authenticated
with check (private.has_permission('content_manage'));
create policy posts_content_update on public.posts for update to authenticated
using (private.has_permission('content_manage')) with check (private.has_permission('content_manage'));
create policy posts_content_delete on public.posts for delete to authenticated
using (private.has_permission('content_manage'));

create policy post_media_public_read on public.post_media
for select to anon, authenticated using (
  exists (select 1 from public.posts p
          where p.post_id=post_media.post_id and p.status='published' and p.is_visible=true)
);
create policy post_media_insert on public.post_media for insert to authenticated
with check (private.has_permission('media_manage'));
create policy post_media_update on public.post_media for update to authenticated
using (private.has_permission('media_manage')) with check (private.has_permission('media_manage'));
create policy post_media_delete on public.post_media for delete to authenticated
using (private.has_permission('media_manage'));

create policy audit_logs_admin_read on public.audit_logs
for select to authenticated using (private.has_permission('audit_view'));
create policy audit_logs_admin_insert on public.audit_logs
for insert to authenticated with check (private.has_permission('audit_view'));

insert into public.website_information default values;
