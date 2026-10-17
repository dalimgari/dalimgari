DROP POLICY IF EXISTS public_media_admin_delete ON storage.objects;
DROP POLICY IF EXISTS public_media_delete_own_anonymous_upload ON storage.objects;
DROP TABLE IF EXISTS public.public_media_uploads CASCADE;
