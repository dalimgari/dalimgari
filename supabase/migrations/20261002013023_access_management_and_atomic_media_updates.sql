
-- Access-management write policies
drop policy if exists "roles admin write" on public.roles;
create policy "roles admin write" on public.roles
  for all to authenticated
  using (private.has_permission('user_manage'))
  with check (private.has_permission('user_manage'));

drop policy if exists "permissions admin write" on public.permissions;
create policy "permissions admin write" on public.permissions
  for all to authenticated
  using (private.has_permission('user_manage'))
  with check (private.has_permission('user_manage'));

drop policy if exists "role_permissions admin write" on public.role_permissions;
create policy "role_permissions admin write" on public.role_permissions
  for all to authenticated
  using (private.has_permission('user_manage'))
  with check (private.has_permission('user_manage'));

-- Atomic replacement of post/media links. The caller is still constrained by RLS
-- because this is SECURITY INVOKER (the default).
create or replace function public.replace_post_media(
  p_post_id uuid,
  p_media_ids uuid[] default '{}'
)
returns setof public.post_media
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_media_ids uuid[];
begin
  v_media_ids := coalesce(
    array(
      select distinct x
      from unnest(coalesce(p_media_ids, '{}')) as u(x)
      where x is not null
    ),
    '{}'
  );

  delete from public.post_media
   where post_id = p_post_id;

  if coalesce(array_length(v_media_ids, 1), 0) > 0 then
    insert into public.post_media(post_id, media_id, display_order)
    select p_post_id, x, ordinality - 1
      from unnest(v_media_ids) with ordinality as u(x, ordinality);
  end if;

  return query
  select pm.*
    from public.post_media pm
   where pm.post_id = p_post_id
   order by pm.display_order asc;
end;
$$;

revoke execute on function public.replace_post_media(uuid, uuid[]) from public, anon;
grant execute on function public.replace_post_media(uuid, uuid[]) to authenticated, service_role;

create index if not exists homepage_settings_updated_by_idx
  on public.homepage_settings(updated_by);

create index if not exists sidebar_settings_updated_by_idx
  on public.sidebar_settings(updated_by);
