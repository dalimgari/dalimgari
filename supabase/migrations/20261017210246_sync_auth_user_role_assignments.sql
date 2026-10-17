-- Synchronize trusted auth metadata with the database RBAC mapping.
-- The raw_app_meta_data role is server-managed; raw_user_meta_data is intentionally ignored.
create or replace function private.assign_default_user_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  target_role text;
begin
  if coalesce(new.raw_app_meta_data ->> 'role', '') = 'admin' then
    target_role := 'admin';
  else
    target_role := 'member';
  end if;

  insert into public.user_roles (user_id, role_id, created_at)
  select new.id, r.id, now()
  from public.roles r
  where r.name = target_role
  on conflict (user_id) do update
    set role_id = excluded.role_id;

  return new;
end;
$function$;

revoke all on function private.assign_default_user_role() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_role on auth.users;
create trigger on_auth_user_created_role
after insert on auth.users
for each row execute function private.assign_default_user_role();

-- Backfill current users using only trusted server-managed app metadata.
insert into public.user_roles (user_id, role_id, created_at)
select u.id, r.id, now()
from auth.users u
join public.roles r
  on r.name = case
    when coalesce(u.raw_app_meta_data ->> 'role', '') = 'admin' then 'admin'
    else 'member'
  end
on conflict (user_id) do update
  set role_id = excluded.role_id;
