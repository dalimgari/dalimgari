alter table public.pages
  add column if not exists title_bn text,
  add column if not exists title_en text,
  add column if not exists content_bn text,
  add column if not exists content_en text;

update public.pages
set
  title_bn = coalesce(title_bn, title),
  content_bn = coalesce(content_bn, content)
where title_bn is null
   or content_bn is null;

alter table public.global_links
  add column if not exists label_bn text,
  add column if not exists label_en text;

update public.global_links
set label_bn = coalesce(label_bn, label)
where label_bn is null;

alter table public.profiles
  add column if not exists language text not null default 'bn'
  check (language in ('bn', 'en'));

create index if not exists pages_title_bn_idx
on public.pages(title_bn);

create index if not exists pages_title_en_idx
on public.pages(title_en);
