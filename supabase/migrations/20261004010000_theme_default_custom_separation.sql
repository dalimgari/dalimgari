begin;

alter table public.theme_settings
  add column if not exists default_day jsonb,
  add column if not exists default_night jsonb,
  add column if not exists custom_day jsonb,
  add column if not exists custom_night jsonb;

update public.theme_settings
set
  default_day = coalesce(default_day, day),
  default_night = coalesce(default_night, night)
where theme_key is not null;

create or replace function public.save_theme_preset(p_theme_key text, p_day jsonb, p_night jsonb)
returns public.theme_settings
language plpgsql
security definer
set search_path = ''
as $function$
declare saved public.theme_settings;
begin
  if not (select private.has_permission('settings_manage'::text)) then raise exception 'Permission denied'; end if;
  if p_theme_key not in ('classic','glass','village') then raise exception 'Invalid theme key'; end if;
  if p_day is null or p_night is null then raise exception 'Theme day/night settings are required'; end if;
  update public.theme_settings set is_active=false, updated_at=now() where theme_key is not null;
  update public.theme_settings
  set custom_day=p_day, custom_night=p_night, day=p_day, night=p_night,
      is_active=true, active_visual_theme=p_theme_key, updated_at=now()
  where theme_key=p_theme_key returning * into saved;
  if saved.theme_settings_id is null then raise exception 'Theme preset not found'; end if;
  return saved;
end;
$function$;

create or replace function public.reset_theme_preset(p_theme_key text)
returns public.theme_settings
language plpgsql
security definer
set search_path = ''
as $function$
declare saved public.theme_settings;
begin
  if not (select private.has_permission('settings_manage'::text)) then raise exception 'Permission denied'; end if;
  if p_theme_key not in ('classic','glass','village') then raise exception 'Invalid theme key'; end if;
  update public.theme_settings set is_active=false, updated_at=now() where theme_key is not null;
  update public.theme_settings
  set custom_day=null, custom_night=null, day=default_day, night=default_night,
      is_active=true, active_visual_theme=p_theme_key, updated_at=now()
  where theme_key=p_theme_key returning * into saved;
  if saved.theme_settings_id is null then raise exception 'Theme preset not found'; end if;
  return saved;
end;
$function$;

commit;