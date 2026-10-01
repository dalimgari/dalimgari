create table if not exists public.homepage_settings (
  settings_id uuid primary key default gen_random_uuid(),
  config jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists homepage_settings_singleton_idx on public.homepage_settings ((true));
alter table public.homepage_settings enable row level security;

drop policy if exists "homepage_settings_public_read" on public.homepage_settings;
create policy "homepage_settings_public_read"
on public.homepage_settings for select to anon, authenticated
using (true);

drop policy if exists "homepage_settings_manage" on public.homepage_settings;
create policy "homepage_settings_manage"
on public.homepage_settings for all to authenticated
using ((select public.current_user_has_permission('homepage_manage')))
with check ((select public.current_user_has_permission('homepage_manage')));

insert into public.homepage_settings (config)
select '{
  "hero":{"enabled":true,"title":"","subtitle":"","showSlogan":true},
  "topicTabs":{"enabled":true,"items":[
    {"label":"গ্রামের তথ্য","href":"/information","enabled":true},
    {"label":"প্রকৃতি","href":"","enabled":true},
    {"label":"গ্রামবাসী","href":"","enabled":true},
    {"label":"ইতিহাস","href":"","enabled":true},
    {"label":"ঐতিহ্য","href":"","enabled":true},
    {"label":"ছবি ও ভিডিও","href":"#media-gallery","enabled":true}
  ]},
  "information":{"enabled":true},
  "posts":{"enabled":true,"limit":6,"title":"গ্রামের খবর"},
  "mediaGallery":{"enabled":true,"title":"গ্যালারি","subtitle":"ছবি ও ভিডিও","showAll":true,"albumIds":[]},
  "albums":{"enabled":true,"limit":4,"title":"অ্যালবাম"},
  "sidebar":{"enabled":true,"items":[],"cards":[]}
}'::jsonb
where not exists (select 1 from public.homepage_settings);

insert into public.permissions (permission_key, permission_name, description, is_active)
values ('homepage_manage','হোমপেজ ম্যানেজমেন্ট','হোমপেজের Hero, ট্যাব, সেকশন, কার্ড, গ্যালারি ও সাইডবার পরিচালনা',true)
on conflict (permission_key) do update set permission_name=excluded.permission_name, description=excluded.description, is_active=true;

insert into public.role_permissions (role_id, permission_id)
select r.role_id, p.permission_id
from public.roles r cross join public.permissions p
where r.role_key='admin' and p.permission_key='homepage_manage'
on conflict do nothing;

grant select on public.homepage_settings to anon, authenticated;
grant insert, update, delete on public.homepage_settings to authenticated;
