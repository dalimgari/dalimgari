delete from public.site_tabs
where page_id is null;

alter table public.site_tabs
drop constraint if exists site_tabs_tab_key_check;

alter table public.site_tabs
alter column title_bn drop not null;

alter table public.site_tabs
alter column title_en drop not null;

alter table public.site_tabs
alter column content_type drop not null;
