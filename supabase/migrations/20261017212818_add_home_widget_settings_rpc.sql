create or replace function public.save_home_widgets(
  p_map_visible boolean,
  p_latitude text,
  p_longitude text,
  p_zoom integer,
  p_clock_visible boolean
)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  map_id uuid;
  clock_id uuid;
  lat double precision;
  lng double precision;
  map_settings jsonb;
begin
  if auth.uid() is null or not private.has_permission('settings.manage') then
    raise exception 'Site settings permission required.' using errcode = '42501';
  end if;

  if p_zoom < 1 or p_zoom > 20 then
    raise exception 'Map zoom must be between 1 and 20.' using errcode = '22023';
  end if;

  if p_map_visible then
    if p_latitude is null or p_longitude is null
       or p_latitude !~ '^-?[0-9]+(\.[0-9]+)?$'
       or p_longitude !~ '^-?[0-9]+(\.[0-9]+)?$' then
      raise exception 'Valid map coordinates are required when the map is visible.' using errcode = '22023';
    end if;
    lat := p_latitude::double precision;
    lng := p_longitude::double precision;
    if lat < -90 or lat > 90 or lng < -180 or lng > 180 then
      raise exception 'Map coordinates are outside the valid range.' using errcode = '22023';
    end if;
  end if;

  map_settings := jsonb_strip_nulls(jsonb_build_object('latitude', lat, 'longitude', lng, 'zoom', p_zoom));

  select id into map_id
  from public.widgets
  where widget_type = 'map'
  order by created_at
  limit 1
  for update;

  if map_id is null then
    insert into public.widgets (title, title_en, widget_type, settings, is_visible, updated_by)
    values ('Village map', 'Village map', 'map', map_settings, p_map_visible, auth.uid());
  else
    update public.widgets
      set settings = map_settings, is_visible = p_map_visible, updated_at = now(), updated_by = auth.uid()
      where id = map_id;
  end if;

  select id into clock_id
  from public.widgets
  where widget_type = 'datetime'
  order by created_at
  limit 1
  for update;

  if clock_id is null then
    insert into public.widgets (title, title_en, widget_type, settings, is_visible, updated_by)
    values ('Date and time', 'Date and time', 'datetime', '{"timeZone":"Asia/Dhaka","showSeconds":false}'::jsonb, p_clock_visible, auth.uid());
  else
    update public.widgets
      set settings = '{"timeZone":"Asia/Dhaka","showSeconds":false}'::jsonb,
          is_visible = p_clock_visible,
          updated_at = now(),
          updated_by = auth.uid()
      where id = clock_id;
  end if;
end;
$function$;

revoke all on function public.save_home_widgets(boolean, text, text, integer, boolean) from public, anon;
grant execute on function public.save_home_widgets(boolean, text, text, integer, boolean) to authenticated;
