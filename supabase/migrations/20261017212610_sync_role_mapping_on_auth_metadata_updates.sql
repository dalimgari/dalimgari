drop trigger if exists on_auth_user_role_metadata_updated on auth.users;
create trigger on_auth_user_role_metadata_updated
after update of raw_app_meta_data on auth.users
for each row
when (old.raw_app_meta_data is distinct from new.raw_app_meta_data)
execute function private.assign_default_user_role();
