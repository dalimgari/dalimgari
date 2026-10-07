-- Remove the last application-level username dependency from the auth profile trigger.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  member_role_id uuid;
  profile_avatar_url text;
begin
  select id into member_role_id
  from public."Role"
  where lower(name) = 'member'
  limit 1;

  profile_avatar_url := coalesce(
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(new.raw_user_meta_data ->> 'picture', '')
  );

  insert into public."User" (
    user_id, email, avatar_url, account_status,
    is_verified, role_id, created_at, updated_at
  )
  values (
    new.id,
    new.email,
    profile_avatar_url,
    'active',
    false,
    member_role_id,
    now(),
    now()
  )
  on conflict (user_id)
  do update set
    email = excluded.email,
    avatar_url = coalesce(excluded.avatar_url, public."User".avatar_url),
    updated_at = now();

  return new;
end;
$function$;