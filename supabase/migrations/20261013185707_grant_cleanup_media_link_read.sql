-- Allow the server-side cleanup function to verify whether Media Library objects
-- are still referenced through media_links. This is server-only access.
GRANT SELECT ON TABLE public.media_links TO service_role;
