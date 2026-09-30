create table if not exists public.domain_icons (
  domain text primary key check (domain = lower(domain) and domain !~ '^www\\.'),
  icon_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.managed_links (
  link_id uuid primary key default gen_random_uuid(),
  title text not null,
  domain text not null references public.domain_icons(domain) on update cascade,
  url text not null,
  icon_domain text not null references public.domain_icons(domain) on update cascade,
  is_active boolean not null default true,
  created_by uuid references public.profiles(profile_id),
  updated_by uuid references public.profiles(profile_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(domain),
  check (url ~* '^https://'),
  check (domain = lower(domain) and domain !~ '^www\\.'),
  check (icon_domain = domain)
);

alter table public.domain_icons enable row level security;
alter table public.managed_links enable row level security;

insert into public.permissions (permission_key, permission_name, description)
values (
  'link_manage',
  '{"bn":"লিঙ্ক ম্যানেজমেন্ট","en":"Link Management"}'::jsonb,
  '{"bn":"লিঙ্ক যোগ, সম্পাদনা ও মুছে ফেলার অনুমতি","en":"Permission to add, edit and delete managed links"}'::jsonb
)
on conflict (permission_key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.role_id, p.permission_id
from public.roles r
cross join public.permissions p
where r.role_key = 'admin' and p.permission_key = 'link_manage'
on conflict do nothing;

drop policy if exists domain_icons_public_select on public.domain_icons;
create policy domain_icons_public_select on public.domain_icons
for select to anon, authenticated using (true);

drop policy if exists domain_icons_admin_insert on public.domain_icons;
create policy domain_icons_admin_insert on public.domain_icons
for insert to authenticated with check (private.has_permission('link_manage'));

drop policy if exists domain_icons_admin_update on public.domain_icons;
create policy domain_icons_admin_update on public.domain_icons
for update to authenticated using (private.has_permission('link_manage')) with check (private.has_permission('link_manage'));

-- Domain icons intentionally have no DELETE policy so they survive link deletion.

drop policy if exists managed_links_public_select on public.managed_links;
create policy managed_links_public_select on public.managed_links
for select to anon, authenticated using (is_active = true);

drop policy if exists managed_links_admin_insert on public.managed_links;
create policy managed_links_admin_insert on public.managed_links
for insert to authenticated with check (private.has_permission('link_manage'));

drop policy if exists managed_links_admin_update on public.managed_links;
create policy managed_links_admin_update on public.managed_links
for update to authenticated using (private.has_permission('link_manage')) with check (private.has_permission('link_manage'));
drop policy if exists managed_links_admin_delete on public.managed_links;
create policy managed_links_admin_delete on public.managed_links
for delete to authenticated using (private.has_permission('link_manage'));

grant select on public.domain_icons, public.managed_links to anon, authenticated;
grant insert, update, delete on public.domain_icons, public.managed_links to authenticated;


-- Global link identity: stable keys such as link_1, link_2, link_3.
alter table public.managed_links
  add column if not exists link_key text,
  add column if not exists display_order integer not null default 0;

alter table public.managed_links drop constraint if exists managed_links_domain_key;

with numbered as (
  select link_id,
         'link_' || row_number() over (order by created_at, link_id) as generated_key,
         row_number() over (order by created_at, link_id) as generated_order
  from public.managed_links
)
update public.managed_links ml
set link_key = numbered.generated_key,
    display_order = numbered.generated_order
from numbered
where ml.link_id = numbered.link_id
  and ml.link_key is null;

update public.managed_links
set link_key = 'link_' || substring(link_id::text, 1, 8)
where link_key is null;

alter table public.managed_links
  alter column link_key set not null;

create unique index if not exists managed_links_link_key_key
  on public.managed_links(link_key);

create unique index if not exists managed_links_display_order_key
  on public.managed_links(display_order);
