DROP POLICY IF EXISTS public_media_submit_anonymous_session ON public.public_media_uploads;
DROP POLICY IF EXISTS public_media_upload_anon_session ON storage.objects;
DROP POLICY IF EXISTS public_media_admin_insert ON public.public_media_uploads;
CREATE POLICY public_media_admin_insert
ON public.public_media_uploads
FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  AND char_length(btrim(title)) BETWEEN 1 AND 160
  AND size_bytes > 0
  AND size_bytes <= 10485760
  AND storage_path LIKE '%/uploads/%'
);
