ALTER TABLE public.albums
  ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]'::jsonb
  CHECK (jsonb_typeof(media) = 'array');

NOTIFY pgrst, 'reload schema';
