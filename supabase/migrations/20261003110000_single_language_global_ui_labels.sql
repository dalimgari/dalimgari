-- Make global UI labels single-language and remove automatic bilingual fallback.
-- Canonical user-facing label is stored in bng; key is the stable identifier.

create or replace function public.ensure_global_ui_label(p_key text, p_label text)
returns public.global_ui_labels
language plpgsql
security definer
set search_path=public
as $$
declare
  result public.global_ui_labels;
begin
  if p_key is null or btrim(p_key) = '' or p_label is null or btrim(p_label) = '' then
    raise exception 'key and label are required';
  end if;

  insert into public.global_ui_labels(key, bng)
  values (btrim(p_key), btrim(p_label))
  on conflict (key) do nothing
  returning * into result;

  if result.key is null then
    select * into result from public.global_ui_labels where key = btrim(p_key);
  end if;

  return result;
end;
$$;

revoke all on function public.ensure_global_ui_label(text, text) from public;
grant execute on function public.ensure_global_ui_label(text, text) to anon, authenticated;

alter table public.global_ui_labels drop column if exists eng;

update public.site_routes
set page_name = 'কী লেবেল ব্যবস্থাপনা'
where route_key = 'manage-key-labels';
