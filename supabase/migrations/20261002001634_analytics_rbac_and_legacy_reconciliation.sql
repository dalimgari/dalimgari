create table if not exists public.analytics_visits (
  visit_id uuid primary key default gen_random_uuid(),
  path text not null,
  referrer text,
  user_agent text,
  session_id text,
  device_class text,
  language text,
  theme text,
  created_at timestamptz not null default now()
);

create index if not exists analytics_visits_created_at_idx on public.analytics_visits(created_at desc);
create index if not exists analytics_visits_path_idx on public.analytics_visits(path);

alter table public.analytics_visits enable row level security;

create or replace function public.record_analytics_visit(
  p_path text,
  p_referrer text default null,
  p_user_agent text default null,
  p_session_id text default null,
  p_device_class text default null,
  p_language text default null,
  p_theme text default null
) returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  if coalesce(length(trim(p_path)), 0) = 0 then
    return null;
  end if;
  insert into public.analytics_visits(path, referrer, user_agent, session_id, device_class, language, theme)
  values (
    left(trim(p_path), 500), left(p_referrer, 1000), left(p_user_agent, 1000), left(p_session_id, 200),
    left(p_device_class, 32), left(p_language, 16), left(p_theme, 16)
  ) returning visit_id into v_id;
  return v_id;
end;
$$;

revoke all on function public.record_analytics_visit(text,text,text,text,text,text,text) from public;
grant execute on function public.record_analytics_visit(text,text,text,text,text,text,text) to anon, authenticated;

create policy analytics_visits_admin_read on public.analytics_visits
for select to authenticated
using (public.current_user_has_permission('audit_view'));

insert into public.roles(role_key, role_name, description, is_active)
values
  ('manager','ম্যানেজার','ওয়েবসাইটের কনটেন্ট, মিডিয়া, হোমপেজ ও সেটিংস পরিচালনা',true),
  ('editor','এডিটর','পেজ, পোস্ট ও প্রকাশিত কনটেন্ট পরিচালনা',true),
  ('moderator','মডারেটর','মিডিয়া ও কনটেন্ট পর্যালোচনা ও পরিচালনা',true)
on conflict (role_key) do update set role_name=excluded.role_name, description=excluded.description, is_active=true, updated_at=now();

insert into public.role_permissions(role_id, permission_id)
select r.role_id, p.permission_id
from public.roles r
join public.permissions p on p.permission_key in ('content_manage','media_manage','homepage_manage','sidebar_manage','settings_manage')
where r.role_key='manager'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.role_id, p.permission_id
from public.roles r
join public.permissions p on p.permission_key in ('content_manage')
where r.role_key='editor'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.role_id, p.permission_id
from public.roles r
join public.permissions p on p.permission_key in ('content_manage','media_manage')
where r.role_key='moderator'
on conflict do nothing;

create index if not exists homepage_settings_updated_by_idx on public.homepage_settings(updated_by);
create index if not exists sidebar_settings_updated_by_idx on public.sidebar_settings(updated_by);

create or replace function public.cleanup_expired_analytics() returns integer
language plpgsql security definer set search_path = public, extensions
as $$
declare v_count integer;
begin
  delete from public.analytics_visits where created_at < now() - interval '90 days';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.delete_expired_analytics_visits() returns bigint
language plpgsql security definer set search_path = public, extensions
as $$
declare v_count bigint;
begin
  delete from public.analytics_visits where created_at < now() - interval '90 days';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.purge_expired_analytics() returns integer
language plpgsql security definer set search_path = public, extensions
as $$
declare v_count integer;
begin
  delete from public.analytics_visits where created_at < now() - interval '90 days';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.restore_database_backup(p_backup_record_id uuid) returns boolean
language plpgsql security definer set search_path = public, extensions
as $$
begin
  return false;
end;
$$;
