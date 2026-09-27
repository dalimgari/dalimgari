create table if not exists public.site_tabs (
  id uuid primary key default gen_random_uuid(),
  tab_key text unique not null,
  title_bn text not null,
  title_en text not null,
  content_type text not null default 'custom'
    check (content_type in (
      'home',
      'info',
      'article',
      'gallery',
      'people',
      'video',
      'news',
      'events',
      'custom'
    )),
  sort_order integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_tabs enable row level security;

drop policy if exists "Public can view enabled tabs" on public.site_tabs;
create policy "Public can view enabled tabs"
on public.site_tabs
for select
to anon, authenticated
using (enabled = true);

drop policy if exists "Admins can manage tabs" on public.site_tabs;
create policy "Admins can manage tabs"
on public.site_tabs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create index if not exists site_tabs_sort_order_idx
on public.site_tabs(sort_order);

insert into public.site_tabs
  (tab_key, title_bn, title_en, content_type, sort_order, enabled)
values
  ('home', 'মূল পাতা', 'Home', 'home', 1, true),
  ('details', 'বিস্তারিত তথ্য', 'Details', 'info', 2, true),
  ('nature', 'প্রকৃতি ও দৃশ্যাবলী', 'Nature & Views', 'gallery', 3, true),
  ('people', 'গ্রামবাসী', 'Village People', 'people', 4, true),
  ('photos', 'ফটো গ্যালারী', 'Photo Gallery', 'gallery', 5, true),
  ('videos', 'ভিডিও গ্যালারী', 'Video Gallery', 'video', 6, true)
on conflict (tab_key) do nothing;
