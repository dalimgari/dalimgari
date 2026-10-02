-- Security hardening for privileged SECURITY DEFINER functions.
-- Keep public functions callable only where they are intentionally part of the public API.

-- Maintenance/backup operations must never be callable by browser roles.
revoke execute on function public.cleanup_expired_analytics() from public, anon, authenticated;
revoke execute on function public.delete_expired_analytics_visits() from public, anon, authenticated;
revoke execute on function public.purge_expired_analytics() from public, anon, authenticated;
revoke execute on function public.restore_database_backup(uuid) from public, anon, authenticated;
grant execute on function public.cleanup_expired_analytics() to service_role;
grant execute on function public.delete_expired_analytics_visits() to service_role;
grant execute on function public.purge_expired_analytics() to service_role;
grant execute on function public.restore_database_backup(uuid) to service_role;

-- Label creation is a privileged settings operation. Existing labels remain readable;
-- only an authorized settings manager may create a missing label through this RPC.
revoke execute on function public.ensure_global_ui_label(text, text) from anon;
grant execute on function public.ensure_global_ui_label(text, text) to authenticated, service_role;

create or replace function public.ensure_global_ui_label(p_key text, p_eng text)
returns public.global_ui_labels
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.global_ui_labels;
begin
  if p_key is null or btrim(p_key) = '' or p_eng is null or btrim(p_eng) = '' then
    raise exception 'key and English label are required';
  end if;

  select * into result
  from public.global_ui_labels
  where key = btrim(p_key);

  if result.key is not null then
    return result;
  end if;

  if not public.current_user_has_permission('settings_manage') then
    raise exception 'Permission denied';
  end if;

  insert into public.global_ui_labels(key, eng, bng)
  values (btrim(p_key), btrim(p_eng), null)
  on conflict (key) do nothing
  returning * into result;

  if result.key is null then
    select * into result
    from public.global_ui_labels
    where key = btrim(p_key);
  end if;

  return result;
end;
$$;

revoke execute on function public.ensure_global_ui_label(text, text) from anon;
grant execute on function public.ensure_global_ui_label(text, text) to authenticated, service_role;
