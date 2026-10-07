create or replace function private.protect_user_privileges()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  actor_role text;
  target_role text;
  existing_admin_count integer;
begin
  actor_role := coalesce((select auth.jwt() ->> 'role'),'');
  target_role := lower(coalesce((select r.name from public."Role" r where r.id = new.role_id),''));

  if tg_op = 'UPDATE'
     and (new.role_id is distinct from old.role_id
          or new.account_status is distinct from old.account_status)
     and actor_role <> 'service_role' then
    raise exception 'Role and account privilege fields can only be changed by the system.';
  end if;

  if tg_op = 'INSERT' and target_role = 'admin' and actor_role <> 'service_role' then
    raise exception 'The administrator role cannot be assigned from the application layer.';
  end if;

  if tg_op = 'UPDATE'
     and new.role_id is distinct from old.role_id
     and target_role = 'admin'
     and actor_role <> 'service_role' then
    raise exception 'The administrator role cannot be assigned from the application layer.';
  end if;

  if tg_op in ('INSERT','UPDATE') and target_role = 'admin' then
    select count(*) into existing_admin_count
    from public."User" u
    join public."Role" r on r.id = u.role_id
    where lower(coalesce(r.name,'')) = 'admin'
      and u.user_id is distinct from new.user_id;

    if existing_admin_count > 0 then
      raise exception 'Only one administrator account is allowed.';
    end if;
  end if;

  if tg_op = 'DELETE'
     and lower(coalesce((select r.name from public."Role" r where r.id = old.role_id),'')) = 'admin'
     and actor_role <> 'service_role' then
    raise exception 'The administrator account cannot be deleted from the application layer.';
  end if;

  return coalesce(new, old);
end;
$function$;

revoke execute on function private.protect_user_privileges() from public, anon, authenticated;

do $$
begin
  if (select count(*) from public."User" u join public."Role" r on r.id=u.role_id where lower(coalesce(r.name,''))='admin') > 1 then
    raise exception 'Cannot enforce single-admin policy because multiple administrator accounts already exist.';
  end if;
end $$;
