alter table public.profiles add column if not exists is_protected boolean not null default false;

create or replace function private.guard_protected_profile()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if old.is_protected then
    raise exception 'Protected account cannot be modified or deleted';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists guard_protected_profile on public.profiles;
create trigger guard_protected_profile
before update or delete on public.profiles
for each row execute function private.guard_protected_profile();

create or replace function private.guard_protected_user_role()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  protected boolean;
begin
  if tg_op = 'DELETE' then
    select is_protected into protected from public.profiles where profile_id = old.profile_id;
  elsif tg_op = 'UPDATE' then
    select is_protected into protected from public.profiles where profile_id = old.profile_id or profile_id = new.profile_id limit 1;
  else
    select is_protected into protected from public.profiles where profile_id = new.profile_id;
  end if;
  if coalesce(protected,false) then
    raise exception 'Protected account role cannot be modified';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists guard_protected_user_role on public.user_roles;
create trigger guard_protected_user_role
before insert or update or delete on public.user_roles
for each row execute function private.guard_protected_user_role();

update public.user_roles
set role_id = (select role_id from public.roles where role_key='admin' and is_active=true)
where profile_id = '50a44d93-b890-49e2-85b8-0f6280614bcb';

update public.profiles
set is_protected = true
where profile_id = '50a44d93-b890-49e2-85b8-0f6280614bcb';

insert into public.user_roles(profile_id, role_id, assigned_by)
select '50a44d93-b890-49e2-85b8-0f6280614bcb', r.role_id, null
from public.roles r
where r.role_key='admin' and r.is_active=true
and not exists (
  select 1 from public.user_roles ur
  where ur.profile_id='50a44d93-b890-49e2-85b8-0f6280614bcb' and ur.role_id=r.role_id
);
