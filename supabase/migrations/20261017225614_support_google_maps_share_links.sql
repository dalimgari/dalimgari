CREATE OR REPLACE FUNCTION public.save_home_widgets(
  p_map_visible boolean,
  p_latitude text,
  p_longitude text,
  p_zoom integer,
  p_clock_visible boolean,
  p_map_url text
)
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  map_id uuid;
  clock_id uuid;
  lat double precision;
  lng double precision;
  lat_text text := nullif(btrim(p_latitude), '');
  lng_text text := nullif(btrim(p_longitude), '');
  clean_map_url text := nullif(btrim(p_map_url), '');
  map_settings jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT private.has_permission('settings.manage') THEN
    RAISE EXCEPTION 'Site settings permission required.' USING errcode = '42501';
  END IF;

  IF p_zoom IS NULL OR p_zoom < 1 OR p_zoom > 20 THEN
    RAISE EXCEPTION 'Map zoom must be between 1 and 20.' USING errcode = '22023';
  END IF;

  IF clean_map_url IS NOT NULL
     AND clean_map_url !~* '^https://(maps\.app\.goo\.gl/[^[:space:]]+|goo\.gl/maps/[^[:space:]]+|((www\.)?google\.com/maps([/?#][^[:space:]]*)?)|(maps\.google\.com(/[^[:space:]]*)?(\?[^[:space:]]*)?))$' THEN
    RAISE EXCEPTION 'Only supported HTTPS Google Maps share links are allowed.' USING errcode = '22023';
  END IF;

  IF (lat_text IS NULL) <> (lng_text IS NULL) THEN
    RAISE EXCEPTION 'Enter both latitude and longitude, or leave both empty.' USING errcode = '22023';
  END IF;

  IF lat_text IS NOT NULL THEN
    IF lat_text !~ '^-?[0-9]+(\.[0-9]+)?$'
       OR lng_text !~ '^-?[0-9]+(\.[0-9]+)?$' THEN
      RAISE EXCEPTION 'Map coordinates must be numeric.' USING errcode = '22023';
    END IF;

    lat := lat_text::double precision;
    lng := lng_text::double precision;
    IF lat < -90 OR lat > 90 OR lng < -180 OR lng > 180 THEN
      RAISE EXCEPTION 'Map coordinates are outside the valid range.' USING errcode = '22023';
    END IF;
  END IF;

  IF p_map_visible AND clean_map_url IS NULL AND lat IS NULL THEN
    RAISE EXCEPTION 'A Google Maps share link or valid coordinates are required when the map is visible.' USING errcode = '22023';
  END IF;

  map_settings := jsonb_strip_nulls(jsonb_build_object(
    'latitude', lat,
    'longitude', lng,
    'zoom', p_zoom,
    'mapUrl', clean_map_url
  ));

  SELECT id INTO map_id
  FROM public.widgets
  WHERE widget_type = 'map'
  ORDER BY created_at
  LIMIT 1
  FOR UPDATE;

  IF map_id IS NULL THEN
    INSERT INTO public.widgets (title, title_en, widget_type, settings, is_visible, updated_by)
    VALUES ('Village map', 'Village map', 'map', map_settings, p_map_visible, auth.uid());
  ELSE
    UPDATE public.widgets
      SET settings = map_settings, is_visible = p_map_visible, updated_at = now(), updated_by = auth.uid()
      WHERE id = map_id;
  END IF;

  SELECT id INTO clock_id
  FROM public.widgets
  WHERE widget_type = 'datetime'
  ORDER BY created_at
  LIMIT 1
  FOR UPDATE;

  IF clock_id IS NULL THEN
    INSERT INTO public.widgets (title, title_en, widget_type, settings, is_visible, updated_by)
    VALUES (
      'Date and time', 'Date and time', 'datetime',
      '{"timeZone":"Asia/Dhaka","showSeconds":false}'::jsonb,
      p_clock_visible, auth.uid()
    );
  ELSE
    UPDATE public.widgets
      SET settings = '{"timeZone":"Asia/Dhaka","showSeconds":false}'::jsonb,
          is_visible = p_clock_visible,
          updated_at = now(),
          updated_by = auth.uid()
      WHERE id = clock_id;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.save_home_widgets(boolean, text, text, integer, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_home_widgets(boolean, text, text, integer, boolean, text) TO authenticated;
