BEGIN;

-- Keep the permission RPC available to signed-in users, but prevent
-- object-shadowing through a mutable search_path in SECURITY DEFINER context.
CREATE OR REPLACE FUNCTION public.get_my_permissions()
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT coalesce(array_agg(DISTINCT p.name ORDER BY p.name), ARRAY[]::text[])
  FROM public.permissions AS p
  WHERE auth.uid() IS NOT NULL
    AND (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
      OR EXISTS (
        SELECT 1
        FROM public.user_roles AS ur
        JOIN public.role_permissions AS rp ON rp.role_id = ur.role_id
        WHERE ur.user_id = auth.uid()
          AND rp.permission_id = p.id
      )
    );
$function$;

-- Preserve the intended RPC contract: authenticated users only.
REVOKE ALL ON FUNCTION public.get_my_permissions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_permissions() TO authenticated;

-- This anon-only policy is redundant: content_public_read already grants
-- anon SELECT only where visibility='public' (and grants admins their intended view).
DROP POLICY IF EXISTS content_public_read_anon ON public.pages;

NOTIFY pgrst, 'reload schema';
COMMIT;
