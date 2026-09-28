alter table public.pages
add column if not exists content_type text not null default 'custom'
check (content_type in (
  'info',
  'article',
  'gallery',
  'people',
  'video',
  'news',
  'events',
  'custom'
));

alter table public.site_tabs
add column if not exists page_id uuid references public.pages(id) on delete set null;

create index if not exists site_tabs_page_id_idx
on public.site_tabs(page_id);

create unique index if not exists site_tabs_page_unique_idx
on public.site_tabs(page_id)
where page_id is not null;

drop policy if exists "Public can view published pages" on public.pages;
create policy "Public can view published pages"
on public.pages
for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins can manage pages" on public.pages;
create policy "Admins can manage pages"
on public.pages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can view enabled tabs" on public.site_tabs;
create policy "Public can view enabled tabs"
on public.site_tabs
for select
to anon, authenticated
using (enabled = true);
