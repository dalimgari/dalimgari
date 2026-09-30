create or replace function public.assign_generated_content_keys()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  prefix text;
  key_column text;
  max_number bigint;
  next_number bigint;
begin
  prefix := case TG_TABLE_NAME
    when 'pages' then 'page'
    when 'posts' then 'post'
    when 'albums' then 'album'
    when 'media' then 'media'
    when 'managed_links' then 'link'
    when 'customization_settings' then 'customization_setting'
    when 'system_settings' then 'system_setting'
    when 'translation_settings' then 'translation_setting'
  end;
  key_column := case TG_TABLE_NAME
    when 'pages' then 'page_key'
    when 'posts' then 'post_key'
    when 'albums' then 'album_key'
    when 'media' then 'media_key'
    when 'managed_links' then 'link_key'
    when 'customization_settings' then 'setting_key'
    when 'system_settings' then 'setting_key'
    when 'translation_settings' then 'setting_key'
  end;
  if prefix is null or key_column is null then return NEW; end if;
  perform pg_advisory_xact_lock(hashtext('generated-key:' || TG_TABLE_NAME));
  if nullif(to_jsonb(NEW)->>key_column, '') is null then
    execute format(
      'select coalesce(max(substring(%I from %L)::bigint), 0) from public.%I where %I ~ %L',
      key_column, '^[0-9]+$', TG_TABLE_NAME, key_column, '^' || prefix || '[0-9]+$'
    ) into max_number;
    next_number := coalesce(max_number, 0) + 1;
    NEW := jsonb_populate_record(NEW, jsonb_build_object(key_column, prefix || next_number));
  end if;
  return NEW;
end;
$$;

drop trigger if exists pages_assign_generated_key on public.pages;
create trigger pages_assign_generated_key before insert on public.pages for each row execute function public.assign_generated_content_keys();
drop trigger if exists posts_assign_generated_key on public.posts;
create trigger posts_assign_generated_key before insert on public.posts for each row execute function public.assign_generated_content_keys();
drop trigger if exists albums_assign_generated_key on public.albums;
create trigger albums_assign_generated_key before insert on public.albums for each row execute function public.assign_generated_content_keys();
drop trigger if exists media_assign_generated_key on public.media;
create trigger media_assign_generated_key before insert on public.media for each row execute function public.assign_generated_content_keys();
drop trigger if exists managed_links_assign_generated_key on public.managed_links;
create trigger managed_links_assign_generated_key before insert on public.managed_links for each row execute function public.assign_generated_content_keys();
drop trigger if exists customization_settings_assign_generated_key on public.customization_settings;
create trigger customization_settings_assign_generated_key before insert on public.customization_settings for each row execute function public.assign_generated_content_keys();
drop trigger if exists system_settings_assign_generated_key on public.system_settings;
create trigger system_settings_assign_generated_key before insert on public.system_settings for each row execute function public.assign_generated_content_keys();
drop trigger if exists translation_settings_assign_generated_key on public.translation_settings;
create trigger translation_settings_assign_generated_key before insert on public.translation_settings for each row execute function public.assign_generated_content_keys();

create index if not exists managed_links_created_by_idx on public.managed_links(created_by);
create index if not exists managed_links_updated_by_idx on public.managed_links(updated_by);
create index if not exists managed_links_icon_domain_idx on public.managed_links(icon_domain);

create index if not exists managed_links_domain_idx on public.managed_links(domain);
