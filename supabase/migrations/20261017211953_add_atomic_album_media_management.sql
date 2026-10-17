create or replace function public.save_album(
  p_album_id uuid,
  p_title text,
  p_description text,
  p_url text,
  p_visibility text,
  p_media_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  saved_id uuid;
  asset_count integer;
  requested_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_title is null or length(btrim(p_title)) < 1 or length(p_title) > 180 then
    raise exception 'A title between 1 and 180 characters is required.' using errcode = '22023';
  end if;
  if p_url is null or length(p_url) > 100 or p_url !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'The album URL is invalid.' using errcode = '22023';
  end if;
  if p_visibility not in ('public', 'private') then
    raise exception 'Invalid album visibility.' using errcode = '22023';
  end if;

  if p_album_id is null then
    if not private.has_permission('content.create') then
      raise exception 'Content creation permission required.' using errcode = '42501';
    end if;
    insert into public.albums (title, title_en, description, description_en, url, visibility, created_by)
    values (btrim(p_title), btrim(p_title), nullif(btrim(p_description), ''), nullif(btrim(p_description), ''), p_url, p_visibility, auth.uid())
    returning id into saved_id;
  else
    if not private.has_permission('content.edit') then
      raise exception 'Content editing permission required.' using errcode = '42501';
    end if;
    perform 1 from public.albums where id = p_album_id for update;
    if not found then
      raise exception 'Album not found or not visible.' using errcode = 'P0002';
    end if;
    update public.albums
      set title = btrim(p_title),
          title_en = btrim(p_title),
          description = nullif(btrim(p_description), ''),
          description_en = nullif(btrim(p_description), ''),
          url = p_url,
          visibility = p_visibility,
          updated_at = now()
      where id = p_album_id
      returning id into saved_id;
  end if;

  p_media_ids := coalesce(p_media_ids, array[]::uuid[]);
  if cardinality(p_media_ids) > 100 then
    raise exception 'An album can contain at most 100 linked media assets.' using errcode = '22023';
  end if;

  select count(distinct asset_id)::integer into requested_count
  from unnest(p_media_ids) as requested(asset_id);

  select count(*)::integer into asset_count
  from public.media_assets
  where id = any(p_media_ids);

  if asset_count <> requested_count then
    raise exception 'One or more media assets do not exist or are not accessible.' using errcode = '22023';
  end if;

  if p_visibility = 'public' and exists (
    select 1 from public.media_assets
    where id = any(p_media_ids) and visibility <> 'public'
  ) then
    raise exception 'Public albums may only contain public media assets.' using errcode = '42501';
  end if;

  delete from public.media_links
  where source_table = 'albums' and source_id = saved_id;

  insert into public.media_links (media_id, source_table, source_id, sort_order)
  select media_id, 'albums', saved_id, (row_number() over (order by first_position) - 1)::integer
  from (
    select media_id, min(position) as first_position
    from unnest(p_media_ids) with ordinality as requested(media_id, position)
    group by media_id
  ) ordered_media;

  return saved_id;
end;
$function$;

revoke all on function public.save_album(uuid, text, text, text, text, uuid[]) from public, anon;
grant execute on function public.save_album(uuid, text, text, text, text, uuid[]) to authenticated;
