BEGIN;

CREATE TABLE IF NOT EXISTS public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 240),
  description text,
  url text NOT NULL UNIQUE,
  content text NOT NULL DEFAULT '',
  media jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(media) = 'array'),
  album_id uuid REFERENCES public.albums(id) ON DELETE SET NULL,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.pages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pages TO authenticated;

DROP POLICY IF EXISTS content_public_read ON public.pages;
CREATE POLICY content_public_read ON public.pages
  FOR SELECT TO anon, authenticated
  USING (visibility = 'public' OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS content_admin_write ON public.pages;
CREATE POLICY content_admin_write ON public.pages
  FOR ALL TO authenticated
  USING (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

ALTER TABLE public.recycle_bin
  DROP CONSTRAINT IF EXISTS recycle_bin_original_table_check;
ALTER TABLE public.recycle_bin
  ADD CONSTRAINT recycle_bin_original_table_check
  CHECK (original_table = ANY (ARRAY[
    'post'::text, 'pages'::text, 'hero_items'::text, 'albums'::text,
    'roles'::text, 'permissions'::text, 'site_customizations'::text, 'site_settings'::text
  ]));

INSERT INTO public.site_customizations (key, value, description)
VALUES
  ('home_page_order', '[]'::jsonb, 'Order of Public pages shown in the homepage Page Title section'),
  ('home_page_includes', '{}'::jsonb, 'Optional page content included in homepage sections')
ON CONFLICT (key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
COMMIT;
