-- Add bilingual metadata to the existing central Media Library without changing
-- file identities, storage paths, RLS policies, or existing consumers.
alter table public.media_assets
  add column if not exists title_en text,
  add column if not exists title_bn text,
  add column if not exists description_en text,
  add column if not exists description_bn text,
  add column if not exists alt_text_en text,
  add column if not exists alt_text_bn text,
  add column if not exists tags_en text[] not null default '{}'::text[],
  add column if not exists tags_bn text[] not null default '{}'::text[];

-- Preserve existing metadata as English so no current values are lost.
update public.media_assets
set
  title_en = coalesce(nullif(btrim(title_en), ''), title),
  description_en = coalesce(nullif(btrim(description_en), ''), description),
  alt_text_en = coalesce(nullif(btrim(alt_text_en), ''), alt_text),
  tags_en = case when cardinality(tags_en) = 0 then coalesce(tags, '{}'::text[]) else tags_en end
where title_en is null
   or description_en is null
   or alt_text_en is null
   or cardinality(tags_en) = 0;

comment on column public.media_assets.title_en is 'English media title; legacy title remains for compatibility.';
comment on column public.media_assets.title_bn is 'Bangla media title.';
comment on column public.media_assets.description_en is 'English media description.';
comment on column public.media_assets.description_bn is 'Bangla media description.';
comment on column public.media_assets.alt_text_en is 'English accessibility alternative text.';
comment on column public.media_assets.alt_text_bn is 'Bangla accessibility alternative text.';
comment on column public.media_assets.tags_en is 'English search tags.';
comment on column public.media_assets.tags_bn is 'Bangla search tags.';
