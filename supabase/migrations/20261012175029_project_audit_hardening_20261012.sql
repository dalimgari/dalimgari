-- Security, policy, and foreign-key index hardening.
begin;

create index if not exists media_assets_created_by_idx
  on public.media_assets (created_by);
create index if not exists pages_album_id_idx
  on public.pages (album_id);
create index if not exists widgets_updated_by_idx
  on public.widgets (updated_by);

create or replace function private.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select case
    when auth.uid() is null then false
    when coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin' then true
    else exists (
      select 1
      from public.user_roles ur
      join public.role_permissions rp on rp.role_id = ur.role_id
      join public.permissions p on p.id = rp.permission_id
      where ur.user_id = auth.uid()
        and p.name = p_permission
    )
  end;
$function$;

create or replace function private.get_my_permissions_impl()
returns text[]
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(array_agg(distinct p.name order by p.name), array[]::text[])
  from public.permissions p
  where auth.uid() is not null
    and (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
      or exists (
        select 1
        from public.user_roles ur
        join public.role_permissions rp on rp.role_id = ur.role_id
        where ur.user_id = auth.uid()
          and rp.permission_id = p.id
      )
    );
$function$;

revoke all on function private.get_my_permissions_impl() from public;
revoke all on function private.get_my_permissions_impl() from anon;
grant execute on function private.get_my_permissions_impl() to authenticated;

create or replace function public.get_my_permissions()
returns text[]
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.get_my_permissions_impl();
$function$;

revoke all on function public.get_my_permissions() from public;
revoke all on function public.get_my_permissions() from anon;
grant execute on function public.get_my_permissions() to authenticated;

drop policy if exists content_admin_write on public.pages;
drop policy if exists content_authenticated_select on public.pages;
drop policy if exists content_public_read on public.pages;
create policy content_public_read
  on public.pages
  for select
  to anon, authenticated
  using (
    visibility = 'public'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or private.has_permission('content.view')
  );

drop policy if exists content_role_delete on public.pages;
create policy content_role_delete
  on public.pages
  for delete
  to authenticated
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or private.has_permission('content.delete')
  );

drop policy if exists content_role_insert on public.pages;
create policy content_role_insert
  on public.pages
  for insert
  to authenticated
  with check (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or private.has_permission('content.create')
  );

drop policy if exists content_role_update on public.pages;
create policy content_role_update
  on public.pages
  for update
  to authenticated
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or private.has_permission('content.edit')
  )
  with check (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or private.has_permission('content.edit')
  );

commit;
