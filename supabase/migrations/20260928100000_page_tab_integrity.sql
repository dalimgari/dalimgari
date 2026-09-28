create unique index if not exists site_tabs_page_id_unique_idx
on public.site_tabs(page_id)
where page_id is not null;

alter table public.site_tabs
drop constraint if exists site_tabs_page_id_fkey;

alter table public.site_tabs
add constraint site_tabs_page_id_fkey
foreign key (page_id)
references public.pages(id)
on delete cascade;
