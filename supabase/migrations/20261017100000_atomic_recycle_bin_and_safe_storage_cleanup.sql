-- Make Recycle Bin operations atomic and prevent unsafe Storage object deletion.
begin;

-- Preserve candidate object paths before expired Recycle Bin metadata is purged.
create table if not exists public.storage_cleanup_queue (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null check (char_length(btrim(bucket_id)) between 1 and 120),
  object_path text not null check (char_length(btrim(object_path)) between 1 and 2048),
  created_at timestamptz not null default now(),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz,
  last_error text,
  unique (bucket_id, object_path)
);
alter table public.storage_cleanup_queue enable row level security;
revoke all on table public.storage_cleanup_queue from public, anon, authenticated;
grant select, insert, update, delete on table public.storage_cleanup_queue to service_role;
drop policy if exists storage_cleanup_queue_service_role_all on public.storage_cleanup_queue;
create policy storage_cleanup_queue_service_role_all on public.storage_cleanup_queue
  for all to service_role using (true) with check (true);

create or replace function public.move_to_recycle_bin(p_table text, p_id uuid)
returns uuid language plpgsql security definer set search_path = ''
as $function$
declare
  v_record jsonb;
  v_related jsonb := '{}'::jsonb;
  v_trash_id uuid;
begin
  if auth.uid() is null or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Administrator permission is required';
  end if;
  if p_table is null or p_table not in ('post','pages','hero_items','albums','roles','permissions','site_customizations','site_settings') then
    raise exception 'Unsupported Recycle Bin table';
  end if;
  if p_id is null then raise exception 'A record ID is required'; end if;

  execute format('select to_jsonb(t) from public.%I t where t.id = $1 for update', p_table)
    into v_record using p_id;
  if v_record is null then raise exception 'Record not found'; end if;

  if p_table = 'roles' then
    select jsonb_build_object(
      'user_roles', coalesce((select jsonb_agg(to_jsonb(ur)) from public.user_roles ur where ur.role_id = p_id), '[]'::jsonb),
      'role_permissions', coalesce((select jsonb_agg(to_jsonb(rp)) from public.role_permissions rp where rp.role_id = p_id), '[]'::jsonb)
    ) into v_related;
  elsif p_table = 'permissions' then
    select jsonb_build_object(
      'role_permissions', coalesce((select jsonb_agg(to_jsonb(rp)) from public.role_permissions rp where rp.permission_id = p_id), '[]'::jsonb)
    ) into v_related;
  elsif p_table = 'albums' then
    select jsonb_build_object(
      'post', coalesce((select jsonb_agg(to_jsonb(x)) from public.post x where x.album_id = p_id), '[]'::jsonb),
      'pages', coalesce((select jsonb_agg(to_jsonb(x)) from public.pages x where x.album_id = p_id), '[]'::jsonb),
      'hero_items', coalesce((select jsonb_agg(to_jsonb(x)) from public.hero_items x where x.album_id = p_id), '[]'::jsonb)
    ) into v_related;
  end if;

  insert into public.recycle_bin(original_table, original_id, record_data, related_data, deleted_by)
  values (p_table, p_id::text, v_record, v_related, auth.uid())
  returning id into v_trash_id;
  execute format('delete from public.%I where id = $1', p_table) using p_id;
  return v_trash_id;
end;
$function$;

create or replace function public.restore_from_recycle_bin(p_recycle_bin_id uuid)
returns text language plpgsql security definer set search_path = ''
as $function$
declare
  v_item public.recycle_bin%rowtype;
  v_child jsonb;
  v_link jsonb;
  v_table text;
begin
  if auth.uid() is null or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Administrator permission is required';
  end if;
  select * into v_item from public.recycle_bin where id = p_recycle_bin_id for update;
  if not found then raise exception 'Recycle Bin item not found'; end if;
  if v_item.original_table not in ('post','pages','hero_items','albums','roles','permissions','site_customizations','site_settings') then
    raise exception 'Unsupported Recycle Bin table';
  end if;

  execute format('insert into public.%I select (jsonb_populate_record(null::public.%I, $1)).*',
    v_item.original_table, v_item.original_table) using v_item.record_data;

  if v_item.original_table = 'roles' then
    for v_link in select value from jsonb_array_elements(coalesce(v_item.related_data->'user_roles', '[]'::jsonb)) loop
      insert into public.user_roles(user_id, role_id, created_at)
      values ((v_link->>'user_id')::uuid, (v_link->>'role_id')::uuid, coalesce((v_link->>'created_at')::timestamptz, now()))
      on conflict (user_id) do nothing;
    end loop;
    for v_link in select value from jsonb_array_elements(coalesce(v_item.related_data->'role_permissions', '[]'::jsonb)) loop
      insert into public.role_permissions(role_id, permission_id)
      values ((v_link->>'role_id')::uuid, (v_link->>'permission_id')::uuid)
      on conflict (role_id, permission_id) do nothing;
    end loop;
  elsif v_item.original_table = 'permissions' then
    for v_link in select value from jsonb_array_elements(coalesce(v_item.related_data->'role_permissions', '[]'::jsonb)) loop
      insert into public.role_permissions(role_id, permission_id)
      values ((v_link->>'role_id')::uuid, (v_link->>'permission_id')::uuid)
      on conflict (role_id, permission_id) do nothing;
    end loop;
  elsif v_item.original_table = 'albums' then
    foreach v_table in array array['post','pages','hero_items'] loop
      for v_child in select value from jsonb_array_elements(coalesce(v_item.related_data->v_table, '[]'::jsonb)) loop
        execute format('update public.%I set album_id = $1 where id = $2 and album_id is null', v_table)
          using (v_item.record_data->>'id')::uuid, (v_child->>'id')::uuid;
      end loop;
    end loop;
  end if;

  delete from public.recycle_bin where id = p_recycle_bin_id;
  return v_item.original_table;
end;
$function$;

revoke all on function public.move_to_recycle_bin(text, uuid) from public, anon;
revoke all on function public.restore_from_recycle_bin(uuid) from public, anon;
grant execute on function public.move_to_recycle_bin(text, uuid) to authenticated;
grant execute on function public.restore_from_recycle_bin(uuid) to authenticated;
commit;
