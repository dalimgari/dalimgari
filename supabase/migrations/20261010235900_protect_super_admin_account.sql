-- Protect the designated Dalimgari Super Admin from deletion and role demotion via Auth APIs.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.protect_dalimgari_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
BEGIN
  IF OLD.id = 'c5b6d47e-3e78-4d4e-bc15-6f137a8c1e75'::uuid THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'The designated Dalimgari Super Admin account cannot be deleted.'
        USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'UPDATE'
       AND COALESCE(NEW.raw_app_meta_data ->> 'role', '') <> 'admin' THEN
      RAISE EXCEPTION 'The designated Dalimgari Super Admin role cannot be removed or changed.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.protect_dalimgari_super_admin() FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS protect_dalimgari_super_admin_delete ON auth.users;
CREATE TRIGGER protect_dalimgari_super_admin_delete
BEFORE DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.protect_dalimgari_super_admin();

DROP TRIGGER IF EXISTS protect_dalimgari_super_admin_role ON auth.users;
CREATE TRIGGER protect_dalimgari_super_admin_role
BEFORE UPDATE OF raw_app_meta_data ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.protect_dalimgari_super_admin();
