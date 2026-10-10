ALTER TABLE public.post
  ADD COLUMN IF NOT EXISTS custom_url text;

NOTIFY pgrst, 'reload schema';
