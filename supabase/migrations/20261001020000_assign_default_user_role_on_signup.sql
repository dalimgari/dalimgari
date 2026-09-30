create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  default_user_role_id uuid;
begin
  insert into public.profiles (profile_id, email, phone, display_name)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (profile_id) do update
    set email = excluded.email,
        phone = excluded.phone,
        display_name = coalesce(excluded.display_name, public.profiles.display_name);

  select role_id
    into default_user_role_id
    from public.roles
   where role_key = 'user'
   limit 1;

  if default_user_role_id is not null then
    insert into public.user_roles (profile_id, role_id)
    values (new.id, default_user_role_id)
    on conflict do nothing;
  end if;

  return new;
end;
$function$;
