-- Rename the third built-in visual theme from Nature to Village.
-- The active theme remains the single system-wide default for the whole website.

begin;

update public.theme_settings
set
  theme_key = 'village',
  settings_key = 'theme_village',
  active_visual_theme = case
    when active_visual_theme = 'nature' then 'village'
    else active_visual_theme
  end
where theme_key = 'nature';

alter table public.theme_settings drop constraint if exists theme_settings_active_visual_theme_check;
alter table public.theme_settings drop constraint if exists theme_settings_theme_key_check;

alter table public.theme_settings
  add constraint theme_settings_theme_key_check
  check (theme_key = any (array['classic','glass','village']));

alter table public.theme_settings
  add constraint theme_settings_active_visual_theme_check
  check (active_visual_theme = any (array['classic','glass','village']));

create or replace function public.save_theme_preset(p_theme_key text, p_day jsonb, p_night jsonb)
returns public.theme_settings
language plpgsql
security definer
set search_path = ''
as $function$
declare saved public.theme_settings;
begin
  if not (select private.has_permission('settings_manage'::text)) then
    raise exception 'Permission denied';
  end if;

  if p_theme_key not in ('classic','glass','village') then
    raise exception 'Invalid theme key';
  end if;

  update public.theme_settings
  set is_active=false, updated_at=now()
  where theme_key is not null;

  update public.theme_settings
  set day=coalesce(p_day,day),
      night=coalesce(p_night,night),
      is_active=true,
      active_visual_theme=p_theme_key,
      updated_at=now()
  where theme_key=p_theme_key
  returning * into saved;

  if saved.theme_settings_id is null then
    raise exception 'Theme preset not found';
  end if;

  return saved;
end;
$function$;

commit;
