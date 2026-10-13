-- Remove a duplicate AFTER INSERT trigger. The canonical trigger remains
-- on_auth_user_created_profile; the metadata-update trigger is intentionally kept.
DROP TRIGGER IF EXISTS sync_auth_user_profile_after_insert ON auth.users;
