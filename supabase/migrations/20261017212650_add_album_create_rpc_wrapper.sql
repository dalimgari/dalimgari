create or replace function public.create_album(
  p_title text,
  p_description text,
  p_url text,
  p_visibility text,
  p_media_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  return public.save_album(null, p_title, p_description, p_url, p_visibility, p_media_ids);
end;
$function$;

revoke all on function public.create_album(text, text, text, text, uuid[]) from public, anon;
grant execute on function public.create_album(text, text, text, text, uuid[]) to authenticated;
