-- Ensure bilingual metadata exists for the existing Media Library.
-- Keep the live schema's tag columns as text arrays and preserve legacy fields/RLS.
alter table public.media_assets
  add column if not exists title_en text,
  add column if not exists title_bn text,
  add column if not exists description_en text,
  add column if not exists description_bn text,
  add column if not exists tags_en text[] not null default '{}'::text[],
  add column if not exists tags_bn text[] not null default '{}'::text[],
  add column if not exists alt_text_en text,
  add column if not exists alt_text_bn text;

-- Preserve legacy values as English metadata. Do not fabricate Bengali translations.
update public.media_assets
set title_en = coalesce(nullif(btrim(title_en), ''), title),
    description_en = coalesce(nullif(btrim(description_en), ''), description),
    alt_text_en = coalesce(nullif(btrim(alt_text_en), ''), alt_text),
    tags_en = case when coalesce(cardinality(tags_en), 0) = 0 then tags else tags_en end
where title_en is null
   or btrim(title_en) = ''
   or description_en is null
   or btrim(description_en) = ''
   or alt_text_en is null
   or btrim(alt_text_en) = ''
   or coalesce(cardinality(tags_en), 0) = 0;

comment on column public.media_assets.title_en is 'English media title';
comment on column public.media_assets.title_bn is 'Bengali media title';
comment on column public.media_assets.description_en is 'English media description';
comment on column public.media_assets.description_bn is 'Bengali media description';
comment on column public.media_assets.tags_en is 'English media tags';
comment on column public.media_assets.tags_bn is 'Bengali media tags';
comment on column public.media_assets.alt_text_en is 'English alternative text';
comment on column public.media_assets.alt_text_bn is 'Bengali alternative text';
