-- Add bilingual metadata to the existing Media Library without changing storage paths or RLS.
-- Legacy columns remain for compatibility with existing content consumers.
alter table public.media_assets
  add column if not exists title_en text,
  add column if not exists title_bn text,
  add column if not exists description_en text,
  add column if not exists description_bn text,
  add column if not exists tags_en text,
  add column if not exists tags_bn text,
  add column if not exists alt_text_en text,
  add column if not exists alt_text_bn text;

-- Preserve existing metadata as the English value; Bengali values can be entered by an administrator.
update public.media_assets
set title_en = coalesce(nullif(btrim(title_en), ''), title),
    description_en = coalesce(nullif(btrim(description_en), ''), description),
    alt_text_en = coalesce(nullif(btrim(alt_text_en), ''), alt_text)
where title_en is null
   or btrim(title_en) = ''
   or description_en is null
   or alt_text_en is null;

comment on column public.media_assets.title_en is 'English media title';
comment on column public.media_assets.title_bn is 'Bengali media title';
comment on column public.media_assets.description_en is 'English media description';
comment on column public.media_assets.description_bn is 'Bengali media description';
comment on column public.media_assets.tags_en is 'Comma-separated English tags';
comment on column public.media_assets.tags_bn is 'Comma-separated Bengali tags';
comment on column public.media_assets.alt_text_en is 'English alternative text';
comment on column public.media_assets.alt_text_bn is 'Bengali alternative text';
