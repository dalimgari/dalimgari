-- Admin security health checks and persisted status.

create table if not exists public.security_test_runs (
  security_test_run_id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('passed','warning','failed')),
  summary jsonb not null default '{}'::jsonb,
  checks jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.security_test_runs enable row level security;

drop policy if exists security_test_runs_select_admin on public.security_test_runs;
create policy security_test_runs_select_admin
on public.security_test_runs
for select to authenticated
using (public.current_user_has_permission('settings_manage'));

create index if not exists security_test_runs_started_at_idx
on public.security_test_runs (started_at desc);

create or replace function public.run_security_tests()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog, storage
as $$
declare
  v_run uuid := gen_random_uuid();
  v_checks jsonb := '[]'::jsonb;
  v_failed int := 0;
  v_warning int := 0;
  v_ok boolean;
  v_table text;
  v_rls boolean;
  v_bucket record;
  v_priv record;
begin
  insert into public.security_test_runs(security_test_run_id,status,summary,checks)
  values(v_run,'warning','{"running":true}'::jsonb,'[]'::jsonb);

  foreach v_table in array array['profiles','roles','user_roles','permissions','posts','pages','media','analytics_visits','global_ui_labels'] loop
    select c.relrowsecurity into v_rls from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname=v_table and c.relkind='r';
    v_ok := coalesce(v_rls,false);
    if not v_ok then v_failed := v_failed + 1; end if;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('key','rls_'||v_table,'label','RLS: '||v_table,'status',case when v_ok then 'passed' else 'failed' end,'detail',case when v_ok then 'RLS enabled' else 'RLS is disabled' end));
  end loop;

  select b.id,b.file_size_limit,b.allowed_mime_types into v_bucket from storage.buckets b where b.id='media';
  v_ok := v_bucket.id is not null and v_bucket.file_size_limit=52428800 and v_bucket.allowed_mime_types is not null and cardinality(v_bucket.allowed_mime_types)>0;
  if not v_ok then v_failed := v_failed + 1; end if;
  v_checks := v_checks || jsonb_build_array(jsonb_build_object('key','media_storage','label','Secure media storage','status',case when v_ok then 'passed' else 'failed' end,'detail',case when v_ok then '50 MB limit + MIME allowlist active' else 'Media bucket restrictions are incomplete' end));

  v_ok := exists(select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='media' and t.tgname='trg_media_rate_limit' and not t.tgisinternal)
    and exists(select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='analytics_visits' and t.tgname='trg_analytics_rate_limit' and not t.tgisinternal);
  if not v_ok then v_failed := v_failed + 1; end if;
  v_checks := v_checks || jsonb_build_array(jsonb_build_object('key','rate_limits','label','Rate limiting','status',case when v_ok then 'passed' else 'failed' end,'detail',case when v_ok then 'Media + analytics rate-limit triggers active' else 'One or more rate-limit triggers missing' end));

  for v_priv in select p.proname,p.prosecdef,coalesce(array_to_string(p.proconfig,','),'') config
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('handle_new_user','get_manageable_users','assign_user_role','ensure_global_ui_label') loop
    v_ok := not v_priv.prosecdef or v_priv.config like '%search_path=%';
    if not v_ok then v_failed := v_failed + 1; end if;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('key','function_'||v_priv.proname,'label','Function hardening: '||v_priv.proname,'status',case when v_ok then 'passed' else 'failed' end,'detail',case when v_ok then 'SECURITY DEFINER search_path is hardened or function is invoker' else 'SECURITY DEFINER lacks hardened search_path' end));
  end loop;

  for v_priv in
    select distinct p.proname
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname in ('handle_new_user','get_manageable_users','assign_user_role','ensure_global_ui_label')
      and (has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE'))
  loop
    v_failed := v_failed + 1;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('key','public_execute_'||v_priv.proname,'label','Public execute grant: '||v_priv.proname,'status','failed','detail','Privileged function is executable by public roles'));
  end loop;

  select not p.prosecdef into v_ok from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='record_analytics_visit' limit 1;
  if not coalesce(v_ok,false) then v_failed := v_failed + 1; end if;
  v_checks := v_checks || jsonb_build_array(jsonb_build_object('key','analytics_rpc','label','Analytics RPC','status',case when coalesce(v_ok,false) then 'passed' else 'failed' end,'detail',case when coalesce(v_ok,false) then 'SECURITY INVOKER' else 'RPC uses SECURITY DEFINER' end));

  v_ok := exists(select 1 from pg_constraint where conname='analytics_visits_path_length_check') and exists(select 1 from pg_constraint where conname='analytics_visits_session_id_length_check');
  if not v_ok then v_failed := v_failed + 1; end if;
  v_checks := v_checks || jsonb_build_array(jsonb_build_object('key','input_constraints','label','Database input constraints','status',case when v_ok then 'passed' else 'failed' end,'detail',case when v_ok then 'Analytics input length constraints active' else 'Expected input constraints are missing' end));

  update public.security_test_runs set status=case when v_failed>0 then 'failed' else case when v_warning>0 then 'warning' else 'passed' end end,
    summary=jsonb_build_object('passed',jsonb_array_length(v_checks)-v_failed-v_warning,'failed',v_failed,'warning',v_warning),
    checks=v_checks,completed_at=now() where security_test_run_id=v_run;
  return (select to_jsonb(r) from public.security_test_runs r where r.security_test_run_id=v_run);
end;
$$;

revoke all on function public.run_security_tests() from public, anon, authenticated;
grant execute on function public.run_security_tests() to service_role;

create or replace function public.get_latest_security_test()
returns jsonb
language plpgsql
stable
set search_path = public
as $$
begin
  if not public.current_user_has_permission('settings_manage') then
    return jsonb_build_object('status','forbidden','summary','{}'::jsonb,'checks','[]'::jsonb);
  end if;
  return coalesce(
    (select to_jsonb(r) from public.security_test_runs r order by started_at desc limit 1),
    jsonb_build_object('status','unknown','summary','{}'::jsonb,'checks','[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_latest_security_test() from public, anon;
grant execute on function public.get_latest_security_test() to authenticated;
