-- Dalimgari authentication and authorization foundation
-- Applied to Supabase project yopfogoyjxwxplnabqii on 2026-10-01.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.roles (
  role_id uuid primary key default extensions.gen_random_uuid(),
  role_key text not null unique,
  role_name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.permissions (
  permission_id uuid primary key default extensions.gen_random_uuid(),
  permission_key text not null unique,
  permission_name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(role_id) on delete cascade,
  permission_id uuid not null references public.permissions(permission_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table if not exists public.profiles (
  profile_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  phone text,
  display_name text,
  bio text,
  link text,
  profile_image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  profile_id uuid primary key references public.profiles(profile_id) on delete cascade,
  role_id uuid not null references public.roles(role_id) on delete restrict,
  assigned_by uuid references public.profiles(profile_id) on delete set null,
  assigned_at timestamptz not null default now()
);

insert into public.roles (role_key, role_name, description) values
 ('admin','Admin','Full administrative access'),
 ('manager','Manager','Management access'),
 ('editor','Editor','Content editing access'),
 ('moderator','Moderator','Moderation access'),
 ('user','User','Standard authenticated user')
on conflict (role_key) do nothing;

insert into public.permissions (permission_key, permission_name, description) values
 ('permission_manage','Manage Permissions','Manage user roles and permissions'),
 ('content_manage','Manage Content','Create, edit and manage public content'),
 ('media_manage','Manage Media','Manage media and uploads'),
 ('user_manage','Manage Users','Manage user accounts and profiles'),
 ('settings_manage','Manage Settings','Manage website settings'),
 ('analytics_view','View Analytics','View website analytics'),
 ('audit_view','View Audit Logs','View audit records')
on conflict (permission_key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.role_id, p.permission_id from public.roles r cross join public.permissions p
where r.role_key='admin' on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.role_id, p.permission_id from public.roles r join public.permissions p
on p.permission_key in ('content_manage','media_manage','analytics_view')
where r.role_key='manager' on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.role_id, p.permission_id from public.roles r join public.permissions p
on p.permission_key in ('content_manage','media_manage')
where r.role_key='editor' on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.role_id, p.permission_id from public.roles r join public.permissions p
on p.permission_key='content_manage'
where r.role_key='moderator' on conflict do nothing;

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

drop policy if exists "roles authenticated read" on public.roles;
create policy "roles authenticated read" on public.roles for select to authenticated using (true);

drop policy if exists "permissions authenticated read" on public.permissions;
create policy "permissions authenticated read" on public.permissions for select to authenticated using (true);

drop policy if exists "role_permissions authenticated read" on public.role_permissions;
create policy "role_permissions authenticated read" on public.role_permissions for select to authenticated using (true);

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles for select to authenticated using ((select auth.uid())=profile_id);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update to authenticated
using ((select auth.uid())=profile_id)
with check ((select auth.uid())=profile_id);

drop policy if exists "user_roles self read" on public.user_roles;
create policy "user_roles self read" on public.user_roles for select to authenticated
using ((select auth.uid())=profile_id);

create or replace function private.has_permission(required_permission text)
returns boolean language sql stable security definer
set search_path=public,private
as $$
select exists (
  select 1 from public.user_roles ur
  join public.role_permissions rp on rp.role_id=ur.role_id
  join public.permissions p on p.permission_id=rp.permission_id
  join public.profiles pr on pr.profile_id=ur.profile_id
  where ur.profile_id=(select auth.uid())
    and pr.is_active=true
    and p.permission_key=required_permission
    and p.is_active=true
);
$$;

revoke all on function private.has_permission(text) from public;
grant execute on function private.has_permission(text) to authenticated;

create or replace function public.current_user_has_permission(required_permission text)
returns boolean language sql stable security invoker
set search_path=public
as $$ select private.has_permission(required_permission); $$;

revoke all on function public.current_user_has_permission(text) from public;
grant execute on function public.current_user_has_permission(text) to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path=public
as $$
declare default_user_role_id uuid;
begin
  insert into public.profiles(profile_id,email,phone,display_name)
  values(new.id,new.email,new.phone,coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name'))
  on conflict(profile_id) do update set email=excluded.email,phone=excluded.phone,
    display_name=coalesce(excluded.display_name,public.profiles.display_name),updated_at=now();
  select role_id into default_user_role_id from public.roles
  where role_key='user' and is_active=true limit 1;
  if default_user_role_id is not null then
    insert into public.user_roles(profile_id,role_id) values(new.id,default_user_role_id)
    on conflict(profile_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path=public
as $$
begin new.updated_at=now(); return new; end;
$$;

drop trigger if exists roles_set_updated_at on public.roles;
create trigger roles_set_updated_at before update on public.roles for each row execute function public.set_updated_at();
drop trigger if exists permissions_set_updated_at on public.permissions;
create trigger permissions_set_updated_at before update on public.permissions for each row execute function public.set_updated_at();
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
