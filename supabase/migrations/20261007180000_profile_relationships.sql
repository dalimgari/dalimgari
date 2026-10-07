alter table public."User"
  add column if not exists avatar_url text;

create unique index if not exists user_user_id_uidx
  on public."User"(user_id)
  where user_id is not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'Album_user_id_fkey') then
    alter table public."Album"
      add constraint "Album_user_id_fkey"
      foreign key (user_id) references public."User"(user_id)
      on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'Media_user_id_fkey') then
    alter table public."Media"
      add constraint "Media_user_id_fkey"
      foreign key (user_id) references public."User"(user_id)
      on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'Media_album_id_fkey') then
    alter table public."Media"
      add constraint "Media_album_id_fkey"
      foreign key (album_id) references public."Album"(id)
      on delete set null;
  end if;
end $$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  member_role_id uuid;
  profile_avatar_url text;
begin
  select id into member_role_id
  from public."Role"
  where lower(name) = 'member'
  limit 1;

  profile_avatar_url := coalesce(
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(new.raw_user_meta_data ->> 'picture', '')
  );

  insert into public."User" (
    user_id, username, email, avatar_url, account_status,
    is_verified, role_id, created_at, updated_at
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username',''),
      nullif(new.raw_user_meta_data ->> 'name',''),
      split_part(coalesce(new.email,''),'@',1)
    ),
    new.email,
    profile_avatar_url,
    'active',
    false,
    member_role_id,
    now(),
    now()
  )
  on conflict (user_id)
  do update set
    email = excluded.email,
    avatar_url = coalesce(excluded.avatar_url, public."User".avatar_url),
    updated_at = now();

  return new;
end;
$function$;

revoke execute on function private.has_permission(text) from public, anon, authenticated;
revoke execute on function private.is_admin() from public, anon, authenticated;
revoke execute on function private.protect_user_privileges() from public, anon, authenticated;
revoke execute on function private.handle_new_user() from public, anon, authenticated;