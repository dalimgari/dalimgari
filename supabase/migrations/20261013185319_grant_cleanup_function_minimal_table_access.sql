-- Grant only the table operations used by the server-side recycle-bin cleanup function.
-- This does not grant these privileges to anon or authenticated clients.
GRANT SELECT, DELETE ON TABLE public.recycle_bin TO service_role;
GRANT SELECT ON TABLE public.media_assets, public.pages, public.albums, public.hero_items, public.post TO service_role;
