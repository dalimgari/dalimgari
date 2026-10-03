create or replace function public.save_theme_preset(p_theme_key text,p_day jsonb,p_night jsonb)
returns public.theme_settings
language plpgsql security definer set search_path=''
as $$
declare saved public.theme_settings;
begin
 if not (select private.has_permission('settings_manage'::text)) then raise exception 'Permission denied'; end if;
 if p_theme_key not in ('classic','glass','nature') then raise exception 'Invalid theme key'; end if;
 update public.theme_settings set is_active=false,updated_at=now() where theme_key is not null;
 update public.theme_settings set day=coalesce(p_day,day),night=coalesce(p_night,night),is_active=true,active_visual_theme=p_theme_key,updated_at=now() where theme_key=p_theme_key returning * into saved;
 if saved.theme_settings_id is null then raise exception 'Theme preset not found'; end if;
 return saved;
end;
$$;
revoke execute on function public.save_theme_preset(text,jsonb,jsonb) from public;
revoke execute on function public.save_theme_preset(text,jsonb,jsonb) from anon;
grant execute on function public.save_theme_preset(text,jsonb,jsonb) to authenticated;