-- Enforce creator-only access for private pages and provide atomic recycle/restore.
drop policy if exists content_authenticated_select on public.pages;
create policy content_authenticated_select
on public.pages
for select
to authenticated
using (
  visibility = 'public'
  or created_by = (select auth.uid())
  or (visibility <> 'private' and private.has_permission('content.view'))
);

drop policy if exists recycle_bin_role_manage on public.recycle_bin;
create policy recycle_bin_role_manage
on public.recycle_bin
for all
to authenticated
using (
  (private.has_permission('content.delete')
    or private.has_permission('roles.manage')
    or private.has_permission('settings.manage'))
  and (
    original_table <> 'pages'
    or coalesce(record_data ->> 'visibility', 'public') <> 'private'
    or deleted_by = (select auth.uid())
  )
)
with check (
  (private.has_permission('content.delete')
    or private.has_permission('roles.manage')
    or private.has_permission('settings.manage'))
  and (
    original_table <> 'pages'
    or coalesce(record_data ->> 'visibility', 'public') <> 'private'
    or deleted_by = (select auth.uid())
  )
);

create or replace function public.recycle_page(p_page_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  page_record public.pages%rowtype;
begin
  if auth.uid() is null or not private.has_permission('content.delete') then
    raise exception 'Not authorized to recycle pages.' using errcode = '42501';
  end if;

  select * into page_record
  from public.pages
  where id = p_page_id
  for update;

  if not found then
    raise exception 'Page not found or not visible to this account.' using errcode = 'P0002';
  end if;

  if page_record.visibility = 'private'
     and page_record.created_by is distinct from auth.uid() then
    raise exception 'Private pages can only be recycled by their creator.' using errcode = '42501';
  end if;

  insert into public.recycle_bin
    (original_table, original_id, record_data, related_data, deleted_by, deleted_at, purge_after)
  values
    ('pages', page_record.id::text, to_jsonb(page_record), '{}'::jsonb, auth.uid(), now(), now() + interval '30 days');

  delete from public.pages where id = p_page_id;
end;
$function$;

create or replace function public.restore_page(p_recycle_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  bin_record public.recycle_bin%rowtype;
begin
  if auth.uid() is null or not private.has_permission('content.delete') then
    raise exception 'Not authorized to restore pages.' using errcode = '42501';
  end if;

  select * into bin_record
  from public.recycle_bin
  where id = p_recycle_id
    and original_table = 'pages'
    and purge_after > now()
  for update;

  if not found then
    raise exception 'Recycle item not found or expired.' using errcode = 'P0002';
  end if;

  if bin_record.record_data ->> 'visibility' = 'private'
     and bin_record.deleted_by is distinct from auth.uid() then
    raise exception 'Private pages can only be restored by their creator.' using errcode = '42501';
  end if;

  insert into public.pages
  select (jsonb_populate_record(null::public.pages, bin_record.record_data)).*;

  delete from public.recycle_bin where id = p_recycle_id;
end;
$function$;

revoke all on function public.recycle_page(uuid) from public, anon;
revoke all on function public.restore_page(uuid) from public, anon;
grant execute on function public.recycle_page(uuid) to authenticated;
grant execute on function public.restore_page(uuid) to authenticated;
