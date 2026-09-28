create table if not exists global_links (
  id uuid primary key default gen_random_uuid(),
  label text,
  url text not null,
  root_domain text not null,
  icon text,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists global_links_enabled_sort_idx
on global_links (enabled, sort_order);

alter table global_links enable row level security;

drop policy if exists "Public can view enabled global links" on global_links;
create policy "Public can view enabled global links"
on global_links
for select
to anon, authenticated
using (enabled = true);

drop policy if exists "Admins can manage global links" on global_links;
create policy "Admins can manage global links"
on global_links
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
