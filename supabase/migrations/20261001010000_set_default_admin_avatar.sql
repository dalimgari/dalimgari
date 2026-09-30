-- Give the admin profile a built-in default avatar when no custom image exists.
-- The admin can replace this value from Admin Information at any time.
DO $$
DECLARE
  default_avatar text := 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 128 128%22%3E%3Crect width=%22128%22 height=%22128%22 rx=%2264%22 fill=%22%23e8eee9%22/%3E%3Ccircle cx=%2264%22 cy=%2248%22 r=%2224%22 fill=%22%236b7f73%22/%3E%3Cpath d=%22M24 112c4-27 20-40 40-40s36 13 40 40%22 fill=%22%236b7f73%22/%3E%3C/svg%3E';
BEGIN
  UPDATE admin_information
  SET information_value = jsonb_set(
    COALESCE(information_value, '{}'::jsonb),
    '{admin_profile_image}',
    to_jsonb(default_avatar),
    true
  )
  WHERE COALESCE(information_value->>'admin_profile_image', '') = '';
END $$;
