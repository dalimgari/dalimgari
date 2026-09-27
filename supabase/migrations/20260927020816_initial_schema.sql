create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user'
    check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists site_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  content text,
  cover_image text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  content text,
  cover_image text,
  author_id uuid references auth.users(id) on delete set null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high')),
  published boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz,
  cover_image text,
  created_by uuid references auth.users(id) on delete set null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  address text,
  phone text,
  website text,
  map_url text,
  image_url text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists important_places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  location text,
  map_url text,
  image_url text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gallery (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  media_url text not null,
  media_type text not null default 'image'
    check (media_type in ('image', 'video')),
  category text,
  uploaded_by uuid references auth.users(id) on delete set null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  role text,
  organization text,
  address text,
  image_url text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  image_url text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  subject text,
  message text not null,
  status text not null default 'new'
    check (status in ('new', 'read', 'replied', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  file_url text not null,
  file_type text,
  uploaded_by uuid references auth.users(id) on delete set null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists news_published_idx
on news(published, published_at desc);

create index if not exists announcements_published_idx
on announcements(published, created_at desc);


create index if not exists gallery_created_at_idx
on gallery(created_at desc);

create index if not exists posts_created_at_idx
on posts(created_at desc);

create index if not exists comments_post_id_idx
on comments(post_id);

create index if not exists likes_post_id_idx
on likes(post_id);

alter table profiles enable row level security;
alter table user_roles enable row level security;
alter table site_settings enable row level security;
alter table pages enable row level security;
alter table news enable row level security;
alter table announcements enable row level security;
alter table events enable row level security;
alter table institutions enable row level security;
alter table important_places enable row level security;
alter table gallery enable row level security;
alter table contacts enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;
alter table contact_messages enable row level security;
alter table documents enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

create policy "Public can view published pages"
on pages for select
using (published = true);

create policy "Public can view published news"
on news for select
using (published = true);

create policy "Public can view published announcements"
on announcements for select
using (published = true);

create policy "Public can view published events"
on events for select
using (published = true);

create policy "Public can view published institutions"
on institutions for select
using (published = true);

create policy "Public can view published places"
on important_places for select
using (published = true);

create policy "Public can view published gallery"
on gallery for select
using (published = true);

create policy "Public can view published contacts"
on contacts for select
using (published = true);

create policy "Public can view published posts"
on posts for select
using (published = true);

create policy "Public can view profiles"
on profiles for select
using (true);

create policy "Users can view comments"
on comments for select
using (true);

create policy "Users can view likes"
on likes for select
using (true);

create policy "Users can create posts"
on posts for insert
to authenticated
with check (auth.uid() = author_id);

create policy "Users can update own posts"
on posts for update
to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

create policy "Users can delete own posts"
on posts for delete
to authenticated
using (auth.uid() = author_id);

create policy "Users can create comments"
on comments for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own comments"
on comments for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own comments"
on comments for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users can create likes"
on likes for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete own likes"
on likes for delete
to authenticated
using (auth.uid() = user_id);

create policy "Anyone can send contact messages"
on contact_messages for insert
to anon, authenticated
with check (true);

create policy "Admins can manage profiles"
on profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage user roles"
on user_roles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage site settings"
on site_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage pages"
on pages for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage news"
on news for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage announcements"
on announcements for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage events"
on events for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage institutions"
on institutions for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage places"
on important_places for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage gallery"
on gallery for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage contacts"
on contacts for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage contact messages"
on contact_messages for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage documents"
on documents for all
to authenticated
using (public.is_admin())
with check (public.is_admin());