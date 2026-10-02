
create table if not exists public.site_routes (
  route_id uuid primary key default gen_random_uuid(),
  route_key text not null unique,
  path text not null unique,
  page_name text not null,
  page_type text not null default 'system',
  is_active boolean not null default true,
  requires_login boolean not null default false,
  required_permission text references public.permissions(permission_key) on update cascade on delete set null,
  fallback_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_routes_path_idx on public.site_routes(path);
create index if not exists site_routes_permission_idx on public.site_routes(required_permission);

alter table public.site_routes enable row level security;

drop policy if exists site_routes_public_read on public.site_routes;
create policy site_routes_public_read on public.site_routes
  for select to anon, authenticated
  using (is_active = true);

drop policy if exists site_routes_admin_insert on public.site_routes;
create policy site_routes_admin_insert on public.site_routes
  for insert to authenticated
  with check (private.has_permission('user_manage'));

drop policy if exists site_routes_admin_update on public.site_routes;
create policy site_routes_admin_update on public.site_routes
  for update to authenticated
  using (private.has_permission('user_manage'))
  with check (private.has_permission('user_manage'));

drop policy if exists site_routes_admin_delete on public.site_routes;
create policy site_routes_admin_delete on public.site_routes
  for delete to authenticated
  using (private.has_permission('user_manage'));

insert into public.permissions(permission_key, permission_name, description)
values
 ('dashboard_view','Dashboard View','View the authenticated user dashboard'),
 ('public_view','Public View','View public website content as a visitor')
on conflict (permission_key) do nothing;

insert into public.roles(role_key, role_name, description, is_active)
values
 ('visitor','Visitor','Anonymous website visitor role',true),
 ('user','ইউজার','সাধারণ লগইন করা ব্যবহারকারী',true)
on conflict (role_key) do update set role_name=excluded.role_name, description=excluded.description, is_active=true;

insert into public.role_permissions(role_id, permission_id)
select r.role_id, p.permission_id
from public.roles r cross join public.permissions p
where r.role_key='visitor' and p.permission_key='public_view'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.role_id, p.permission_id
from public.roles r cross join public.permissions p
where r.role_key in ('admin','manager','editor','moderator','user') and p.permission_key='dashboard_view'
on conflict do nothing;

insert into public.site_routes(route_key,path,page_name,page_type,requires_login,required_permission,fallback_enabled)
values
 ('home','/','হোম','system',false,null,false),
 ('posts','/posts','পোস্ট','system',false,null,true),
 ('albums','/albums','অ্যালবাম','system',false,null,true),
 ('information','/information','তথ্য','system',false,null,true),
 ('dashboard','/dashboard','ড্যাশবোর্ড','dashboard',true,'dashboard_view',false),
 ('login','/login','লগইন','system',false,null,false),
 ('signup','/signup','সাইনআপ','system',false,null,false),
 ('manage-homepage','/manage/homepage','হোমপেজ ম্যানেজমেন্ট','management',true,'homepage_manage',true),
 ('manage-sidebar','/manage/sidebar','সাইডবার ম্যানেজমেন্ট','management',true,'sidebar_manage',true),
 ('manage-pages','/manage/pages','পেজ ম্যানেজমেন্ট','management',true,'content_manage',true),
 ('manage-posts','/manage/posts','পোস্ট ম্যানেজমেন্ট','management',true,'content_manage',true),
 ('manage-albums','/manage/albums','অ্যালবাম ম্যানেজমেন্ট','management',true,'media_manage',true),
 ('manage-media','/manage/media','মিডিয়া ম্যানেজমেন্ট','management',true,'media_manage',true),
 ('manage-users','/manage/users','ইউজার ম্যানেজমেন্ট','management',true,'user_manage',true),
 ('manage-access','/manage/access','অ্যাক্সেস ম্যানেজমেন্ট','management',true,'user_manage',true),
 ('manage-audit','/manage/audit','অডিট লগ','management',true,'audit_view',true),
 ('manage-analytics','/manage/analytics','পরিসংখ্যান','management',true,'audit_view',true),
 ('manage-website-information','/manage/website-information','ওয়েবসাইট তথ্য','management',true,'settings_manage',true),
 ('manage-admin-information','/manage/admin-information','অ্যাডমিন তথ্য','management',true,'settings_manage',true),
 ('manage-database-storage','/manage/database-storage','ডাটাবেজ ও স্টোরেজ','management',true,'settings_manage',true),
 ('manage-rural-visual','/manage/rural-visual','রুরাল ভিজ্যুয়াল','management',true,'settings_manage',true),
 ('manage-key-labels','/manage/key-labels','Key Label Rename','management',true,'settings_manage',true)
on conflict (route_key) do update set
 path=excluded.path,page_name=excluded.page_name,page_type=excluded.page_type,
 is_active=true,requires_login=excluded.requires_login,required_permission=excluded.required_permission,
 fallback_enabled=excluded.fallback_enabled,updated_at=now();

create or replace function private.has_permission(required_permission text)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $function$
  select
    exists (
      select 1
      from public.roles r
      join public.role_permissions rp on rp.role_id = r.role_id
      join public.permissions p on p.permission_id = rp.permission_id
      where r.role_key = 'visitor'
        and r.is_active = true
        and p.permission_key = required_permission
        and p.is_active = true
        and (select auth.uid()) is null
    )
    or exists (
      select 1
      from public.profiles pr
      where pr.profile_id = (select auth.uid())
        and pr.is_active = true
        and pr.is_protected = true
    )
    or exists (
      select 1
      from public.user_roles ur
      join public.role_permissions rp on rp.role_id = ur.role_id
      join public.permissions p on p.permission_id = rp.permission_id
      join public.profiles pr on pr.profile_id = ur.profile_id
      where ur.profile_id = (select auth.uid())
        and pr.is_active = true
        and p.permission_key = required_permission
        and p.is_active = true
    );
$function$;

create or replace function public.current_user_has_permission(required_permission text)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $function$
  select private.has_permission(required_permission);
$function$;

grant execute on function public.current_user_has_permission(text) to anon, authenticated;

create or replace function public.can_access_route(requested_path text)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $function$
  select coalesce((
    select
      case
        when not sr.is_active then false
        when sr.requires_login and (select auth.uid()) is null then false
        when sr.required_permission is null then true
        else private.has_permission(sr.required_permission)
      end
    from public.site_routes sr
    where sr.path = requested_path
    limit 1
  ), false);
$function$;

grant execute on function public.can_access_route(text) to anon, authenticated;
