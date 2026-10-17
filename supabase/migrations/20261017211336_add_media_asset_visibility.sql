alter table public.media_assets
  add column if not exists visibility text not null default 'private';

do $block$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.media_assets'::regclass
      and conname = 'media_assets_visibility_check'
  ) then
    alter table public.media_assets
      add constraint media_assets_visibility_check
      check (visibility in ('public', 'private'));
  end if;
end;
$block$;

create index if not exists media_assets_visibility_idx
  on public.media_assets (visibility);
create index if not exists media_links_source_lookup_idx
  on public.media_links (source_table, source_id, sort_order);
