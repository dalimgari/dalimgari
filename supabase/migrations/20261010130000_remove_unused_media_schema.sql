-- Remove database objects left behind after disabling media features.
-- Historical migration files are intentionally retained.
begin;

ALTER TABLE public.post DROP CONSTRAINT IF EXISTS posts_album_id_fkey;
ALTER TABLE public.post DROP COLUMN IF EXISTS album_id;
ALTER TABLE public.post DROP COLUMN IF EXISTS media_type;
ALTER TABLE public.post DROP COLUMN IF EXISTS source_type;
ALTER TABLE public.post DROP COLUMN IF EXISTS storage_path;
ALTER TABLE public.post DROP COLUMN IF EXISTS external_url;
ALTER TABLE public.post DROP COLUMN IF EXISTS media_url;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar_url;

DROP TABLE IF EXISTS public.media_upload_tests;
DROP TABLE IF EXISTS public.albums;

ALTER TABLE public.recycle_bin DROP CONSTRAINT IF EXISTS recycle_bin_original_table_check;
ALTER TABLE public.recycle_bin
  ADD CONSTRAINT recycle_bin_original_table_check
  CHECK (original_table = ANY (ARRAY[
    'post'::text,
    'pages'::text,
    'roles'::text,
    'permissions'::text,
    'site_customizations'::text,
    'site_settings'::text
  ]));

commit;
