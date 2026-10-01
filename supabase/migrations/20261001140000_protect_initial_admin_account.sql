-- Reproducible protection for profiles marked as protected.
-- This migration is idempotent so it can be applied safely to an existing database.

create schema if not exists private;

alter table public.profiles
  add column if not exists is_protected boolean not null default false;

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
    select is_protected into protected
    from public.profiles
    where profile_id = old.profile_id;
  elsif tg_op = 'UPDATE' then
    select is_protected into protected
    from public.profiles
    where profile_id = old.profile_id or profile_id = new.profile_id
    limit 1;
  else
    select is_protected into protected
    from public.profiles
    where profile_id = new.profile_id;
  end if;

  if coalesce(protected, false) then
    raise exception 'Protected account role cannot be modified';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists guard_protected_profile on public.profiles;
create trigger guard_protected_profile
before delete or update on public.profiles
for each row execute function private.guard_protected_profile();

drop trigger if exists guard_protected_user_role on public.user_roles;
create trigger guard_protected_user_role
before insert or delete or update on public.user_roles
for each row execute function private.guard_protected_user_role();
