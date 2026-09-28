create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id text,
  user_id uuid references auth.users(id) on delete set null,
  visited_at timestamptz not null default now(),
  page_path text,
  referrer text,
  device_type text,
  browser text,
  operating_system text,
  language text,
  timezone text,
  screen_width integer,
  screen_height integer,
  is_returning boolean not null default false
);

create index if not exists site_visits_visited_at_idx
on public.site_visits(visited_at);

create index if not exists site_visits_user_id_idx
on public.site_visits(user_id);

create index if not exists site_visits_visitor_id_idx
on public.site_visits(visitor_id);

alter table public.site_visits enable row level security;

drop policy if exists "Public can record visits" on public.site_visits;
create policy "Public can record visits"
on public.site_visits
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read visits" on public.site_visits;
create policy "Admins can read visits"
on public.site_visits
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role = 'admin'
  )
);

create or replace function public.admin_user_directory()
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  age integer,
  date_of_birth date,
  avatar_url text,
  bio text,
  role text,
  created_at timestamptz,
  permissions text[]
)
language sql
security definer
set search_path = public, auth
as $$
  select
    u.id,
    u.email::text,
    p.full_name,
    p.phone,
    p.age,
    p.date_of_birth,
    p.avatar_url,
    p.bio,
    coalesce(r.role, 'user') as role,
    u.created_at,
    coalesce(
      array_agg(up.permission) filter (where up.permission is not null),
      '{}'::text[]
    ) as permissions
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.user_roles r on r.user_id = u.id
  left join public.user_permissions up on up.user_id = u.id
  where exists (
    select 1
    from public.user_roles ar
    where ar.user_id = auth.uid()
    and ar.role = 'admin'
  )
  group by
    u.id,
    u.email,
    p.full_name,
    p.phone,
    p.age,
    p.date_of_birth,
    p.avatar_url,
    p.bio,
    r.role,
    u.created_at
  order by u.created_at desc;
$$;

revoke all on function public.admin_user_directory() from public;
grant execute on function public.admin_user_directory() to authenticated;
