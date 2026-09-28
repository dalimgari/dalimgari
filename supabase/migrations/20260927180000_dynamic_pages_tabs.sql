alter table public.pages
add column if not exists content_type text not null default 'article'
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
add column if not exists page_id uuid references public.pages(id) on delete cascade;

create index if not exists site_tabs_page_id_idx
on public.site_tabs(page_id);

delete from public.site_tabs;

drop policy if exists "Public can view enabled tabs" on public.site_tabs;

create policy "Public can view enabled tabs"
on public.site_tabs
for select
to anon, authenticated
using (
  enabled = true
  and page_id is not null
  and exists (
    select 1
    from public.pages
    where pages.id = site_tabs.page_id
      and pages.published = true
  )
);

drop policy if exists "Admins can manage tabs" on public.site_tabs;

create policy "Admins can manage tabs"
on public.site_tabs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can view published pages" on public.pages;

create policy "Public can view published pages"
on public.pages
for select
to anon, authenticated
using (published = true);

create index if not exists pages_published_idx
on public.pages(published);

create index if not exists pages_slug_idx
on public.pages(slug);
