-- Independent sidebar menu management
create table if not exists public.sidebar_settings (
  settings_id uuid primary key default gen_random_uuid(),
  config jsonb not null default '{"enabled": true, "items": []}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists sidebar_settings_singleton_idx on public.sidebar_settings ((true));
alter table public.sidebar_settings enable row level security;

drop policy if exists "sidebar settings public read" on public.sidebar_settings;
create policy "sidebar settings public read" on public.sidebar_settings for select to anon, authenticated using (true);

drop policy if exists "sidebar settings manage" on public.sidebar_settings;
create policy "sidebar settings manage" on public.sidebar_settings for all to authenticated
using (public.current_user_has_permission('sidebar_manage'))
with check (public.current_user_has_permission('sidebar_manage'));

grant select on public.sidebar_settings to anon, authenticated;
grant insert, update, delete on public.sidebar_settings to authenticated;

insert into public.permissions (permission_key, permission_name, description)
values ('sidebar_manage', 'সাইডবার ম্যানেজমেন্ট', 'সাইডবারে কোন প্রকাশিত পেজের মেনু থাকবে এবং তার ক্রম নির্ধারণ')
on conflict (permission_key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.role_id, p.permission_id from public.roles r cross join public.permissions p
where r.role_key='admin' and p.permission_key='sidebar_manage' on conflict do nothing;

insert into public.sidebar_settings (config)
select '{"enabled": true, "items": []}'::jsonb
where not exists (select 1 from public.sidebar_settings);
