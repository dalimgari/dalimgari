-- Security hardening: input/storage validation, rate limits, and privileged RPC grants.

create schema if not exists private;

create table if not exists private.security_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0,
  updated_at timestamptz not null default now()
);

revoke all on private.security_rate_limits from anon, authenticated;

create or replace function private.enforce_media_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare v_count integer;
begin
  select count(*) into v_count
  from public.media
  where created_by = auth.uid()
    and created_at >= now() - interval '1 minute';
  if v_count >= 30 then
    raise exception 'Media upload rate limit exceeded';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_analytics_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare v_count integer;
begin
  if new.session_id is null or btrim(new.session_id) = '' then return new; end if;
  select count(*) into v_count
  from public.analytics_visits
  where session_id = new.session_id
    and created_at >= now() - interval '1 minute';
  if v_count >= 60 then
    raise exception 'Analytics rate limit exceeded';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_media_rate_limit on public.media;
create trigger trg_media_rate_limit
before insert on public.media
for each row execute function private.enforce_media_rate_limit();

drop trigger if exists trg_analytics_rate_limit on public.analytics_visits;
create trigger trg_analytics_rate_limit
before insert on public.analytics_visits
for each row execute function private.enforce_analytics_rate_limit();

do $$
begin
  if to_regprocedure('public.handle_new_user()') is not null then
    revoke execute on function public.handle_new_user() from public, anon, authenticated;
  end if;
  if to_regprocedure('public.get_manageable_users()') is not null then
    revoke execute on function public.get_manageable_users() from public, anon;
    grant execute on function public.get_manageable_users() to authenticated;
  end if;
  if to_regprocedure('public.assign_user_role(uuid,text)') is not null then
    revoke execute on function public.assign_user_role(uuid,text) from public, anon;
    grant execute on function public.assign_user_role(uuid,text) to authenticated;
  end if;
end
$$;

revoke execute on function public.ensure_global_ui_label(text,text) from public, anon, authenticated;
grant execute on function public.ensure_global_ui_label(text,text) to authenticated;

create or replace function public.ensure_global_ui_label(p_key text, p_eng text)
returns public.global_ui_labels
language plpgsql
security definer
set search_path = public
as $$
declare result public.global_ui_labels;
begin
  if not public.current_user_has_permission('settings_manage') then
    raise exception 'Permission denied';
  end if;
  if p_key is null or btrim(p_key)='' or p_eng is null or btrim(p_eng)='' then
    raise exception 'key and English label are required';
  end if;
  select * into result from public.global_ui_labels where key=btrim(p_key);
  if result.key is not null then return result; end if;
  insert into public.global_ui_labels(key,eng,bng)
  values(btrim(p_key),btrim(p_eng),null)
  on conflict(key) do nothing
  returning * into result;
  if result.key is null then
    select * into result from public.global_ui_labels where key=btrim(p_key);
  end if;
  return result;
end;
$$;

create or replace function public.get_sitemap_content()
returns jsonb
language sql
stable
set search_path = public
as $$
select jsonb_build_object(
  'posts',coalesce((select jsonb_agg(jsonb_build_object('post_id',p.post_id) order by p.post_id)
    from public.posts p where p.status='published'::public.record_status and p.is_visible=true),'[]'::jsonb),
  'pages',coalesce((select jsonb_agg(jsonb_build_object('page_slug',pg.page_slug) order by pg.page_slug)
    from public.pages pg where pg.status='published'::public.record_status and pg.is_visible=true),'[]'::jsonb)
);
$$;

update storage.buckets
set file_size_limit=52428800,
    allowed_mime_types=array[
      'image/*','video/*','audio/*','application/pdf','text/plain','text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
where id='media';
