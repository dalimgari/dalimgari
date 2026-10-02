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
returns trigger language plpgsql security definer set search_path = public, private as $$
declare v_count integer;
begin
  select count(*) into v_count from public.media
  where created_by = auth.uid() and created_at >= now() - interval '1 minute';
  if v_count >= 30 then raise exception 'Media upload rate limit exceeded'; end if;
  return new;
end;
$$;

create or replace function private.enforce_analytics_rate_limit()
returns trigger language plpgsql security definer set search_path = public, private as $$
declare v_count integer;
begin
  if new.session_id is null or btrim(new.session_id) = '' then return new; end if;
  select count(*) into v_count from public.analytics_visits
  where session_id = new.session_id and created_at >= now() - interval '1 minute';
  if v_count >= 60 then raise exception 'Analytics rate limit exceeded'; end if;
  return new;
end;
$$;

drop trigger if exists trg_media_rate_limit on public.media;
create trigger trg_media_rate_limit before insert on public.media for each row execute function private.enforce_media_rate_limit();

drop trigger if exists trg_analytics_rate_limit on public.analytics_visits;
create trigger trg_analytics_rate_limit before insert on public.analytics_visits for each row execute function private.enforce_analytics_rate_limit();

alter table public.analytics_visits
  drop constraint if exists analytics_visits_path_length_check,
  drop constraint if exists analytics_visits_referrer_length_check,
  drop constraint if exists analytics_visits_user_agent_length_check,
  drop constraint if exists analytics_visits_session_id_length_check,
  drop constraint if exists analytics_visits_device_class_length_check,
  drop constraint if exists analytics_visits_language_length_check,
  drop constraint if exists analytics_visits_theme_length_check;

alter table public.analytics_visits
  add constraint analytics_visits_path_length_check check (coalesce(length(trim(path)),0) between 1 and 500),
  add constraint analytics_visits_referrer_length_check check (coalesce(length(referrer),0) <= 1000),
  add constraint analytics_visits_user_agent_length_check check (coalesce(length(user_agent),0) <= 1000),
  add constraint analytics_visits_session_id_length_check check (coalesce(length(session_id),0) <= 200),
  add constraint analytics_visits_device_class_length_check check (coalesce(length(device_class),0) <= 32),
  add constraint analytics_visits_language_length_check check (coalesce(length(language),0) <= 16),
  add constraint analytics_visits_theme_length_check check (coalesce(length(theme),0) <= 16);

drop policy if exists analytics_visits_public_insert on public.analytics_visits;
create policy analytics_visits_public_insert on public.analytics_visits
for insert to anon, authenticated
with check (true);

create or replace function public.record_analytics_visit(
  p_path text, p_referrer text default null, p_user_agent text default null,
  p_session_id text default null, p_device_class text default null,
  p_language text default null, p_theme text default null
)
returns uuid language plpgsql set search_path = public, extensions as $$
declare v_id uuid := gen_random_uuid();
begin
  if coalesce(length(trim(p_path)),0)=0 then return null; end if;
  insert into public.analytics_visits(
    visit_id,path,referrer,user_agent,session_id,device_class,language,theme
  )
  values(
    v_id,left(trim(p_path),500),left(p_referrer,1000),left(p_user_agent,1000),
    left(p_session_id,200),left(p_device_class,32),left(p_language,16),left(p_theme,16)
  );
  return v_id;
end;
$$;
grant execute on function public.record_analytics_visit(text,text,text,text,text,text,text) to anon, authenticated;

do $$
begin
  if to_regprocedure('public.handle_new_user()') is not null then
    revoke execute on function public.handle_new_user() from public, anon, authenticated;
  end if;
  if to_regprocedure('public.get_manageable_users()') is not null then
    revoke execute on function public.get_manageable_users() from public, anon, authenticated;
  end if;
  if to_regprocedure('public.assign_user_role(uuid,text)') is not null then
    revoke execute on function public.assign_user_role(uuid,text) from public, anon, authenticated;
  end if;
end
$$;

revoke execute on function public.ensure_global_ui_label(text,text) from public, anon, authenticated;

create or replace function public.get_sitemap_content()
returns jsonb language sql stable set search_path = public as $$
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
