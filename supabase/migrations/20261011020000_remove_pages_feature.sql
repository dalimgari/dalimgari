BEGIN;

-- Remove records that depend on the Pages feature.
DELETE FROM public.recycle_bin WHERE original_table = 'pages';
DELETE FROM public.site_customizations
WHERE key IN ('home_page_order', 'home_page_includes');

-- Pages is no longer a valid Recycle Bin item type.
ALTER TABLE public.recycle_bin
  DROP CONSTRAINT IF EXISTS recycle_bin_original_table_check;

ALTER TABLE public.recycle_bin
  ADD CONSTRAINT recycle_bin_original_table_check
  CHECK (original_table = ANY (ARRAY[
    'post'::text,
    'hero_items'::text,
    'albums'::text,
    'roles'::text,
    'permissions'::text,
    'site_customizations'::text,
    'site_settings'::text
  ]));

-- Remove the Pages data model and its dependent foreign key/policies/indexes.
DROP TABLE IF EXISTS public.pages CASCADE;

NOTIFY pgrst, 'reload schema';

COMMIT;
