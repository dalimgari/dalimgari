-- Give the designated app administrator full CRUD access to every current
-- table in public, plus all objects in Supabase Storage. This does not grant
-- Supabase project-owner privileges or expose service-role credentials.

DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r','p')
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', t.relname);
    EXECUTE format('DROP POLICY IF EXISTS admin_full_access ON public.%I', t.relname);
    EXECUTE format(
      'CREATE POLICY admin_full_access ON public.%I FOR ALL TO authenticated USING ((select auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'') WITH CHECK ((select auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'')',
      t.relname
    );
  END LOOP;
END $$;

DROP POLICY IF EXISTS admin_full_access_all_storage_objects ON storage.objects;
CREATE POLICY admin_full_access_all_storage_objects
ON storage.objects
FOR ALL
TO authenticated
USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
