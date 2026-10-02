create or replace function public.replace_role_permissions(
  p_role_id uuid,
  p_permission_ids uuid[] default '{}'
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.role_permissions where role_id = p_role_id;
  if coalesce(array_length(p_permission_ids,1),0) > 0 then
    insert into public.role_permissions(role_id,permission_id)
    select p_role_id,x
    from unnest(p_permission_ids) as u(x)
    where x is not null;
  end if;
end;
$$;
revoke execute on function public.replace_role_permissions(uuid, uuid[]) from public, anon;
grant execute on function public.replace_role_permissions(uuid, uuid[]) to authenticated, service_role;