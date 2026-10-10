-- Make public.profiles the canonical source for profile fields.
-- The existing Auth trigger remains responsible only for ensuring a profile row exists.

CREATE OR REPLACE FUNCTION public.sync_auth_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

UPDATE public.profiles AS p
SET
  full_name = COALESCE(NULLIF(p.full_name, ''), NULLIF(u.raw_user_meta_data ->> 'full_name', ''), NULLIF(u.raw_user_meta_data ->> 'name', '')),
  phone = COALESCE(p.phone, NULLIF(u.raw_user_meta_data ->> 'phone', '')),
  date_of_birth = COALESCE(
    p.date_of_birth,
    CASE
      WHEN COALESCE(u.raw_user_meta_data ->> 'date_of_birth', '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      THEN (u.raw_user_meta_data ->> 'date_of_birth')::date
      ELSE NULL
    END
  ),
  bio = COALESCE(p.bio, NULLIF(u.raw_user_meta_data ->> 'bio', '')),
  avatar_url = COALESCE(
    p.avatar_url,
    CASE
      WHEN COALESCE(u.raw_user_meta_data ->> 'avatar_url', '') NOT LIKE 'data:%'
      THEN NULLIF(u.raw_user_meta_data ->> 'avatar_url', '')
      ELSE NULL
    END
  ),
  updated_at = now()
FROM auth.users AS u
WHERE p.id = u.id;

INSERT INTO public.profiles (id, created_at, updated_at)
SELECT u.id, now(), now()
FROM auth.users AS u
ON CONFLICT (id) DO NOTHING;

-- Keep the legacy base64 avatar temporarily so the client can migrate it into Storage
-- on the next profile view. All other profile fields are removed from Auth metadata.
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
  - 'full_name' - 'name' - 'phone' - 'date_of_birth' - 'bio'
WHERE COALESCE(raw_user_meta_data, '{}'::jsonb) ?| ARRAY['full_name','name','phone','date_of_birth','bio'];