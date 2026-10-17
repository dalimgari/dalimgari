alter table public.media_assets
  add column if not exists content_hash text;

do $block$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.media_assets'::regclass
      and conname = 'media_assets_content_hash_check'
  ) then
    alter table public.media_assets
      add constraint media_assets_content_hash_check
      check (content_hash is null or content_hash ~ '^[a-f0-9]{64}$');
  end if;
end;
$block$;

create unique index if not exists media_assets_content_hash_unique
  on public.media_assets (content_hash)
  where content_hash is not null;
