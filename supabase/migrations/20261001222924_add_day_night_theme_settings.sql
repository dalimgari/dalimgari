create table if not exists public.theme_settings (
  theme_settings_id uuid primary key default gen_random_uuid(),
  settings_key text not null unique default 'global',
  day jsonb not null default '{}'::jsonb,
  night jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists theme_settings_active_idx on public.theme_settings (is_active, updated_at desc);

alter table public.theme_settings enable row level security;

drop policy if exists "theme_settings_public_read" on public.theme_settings;
create policy "theme_settings_public_read" on public.theme_settings
for select to anon, authenticated using (is_active = true);

drop policy if exists "theme_settings_admin_write" on public.theme_settings;
create policy "theme_settings_admin_write" on public.theme_settings
for all to authenticated
using (private.has_permission('settings_manage'))
with check (private.has_permission('settings_manage'));

drop trigger if exists theme_settings_set_updated_at on public.theme_settings;
create trigger theme_settings_set_updated_at
before update on public.theme_settings
for each row execute function public.set_updated_at();

insert into public.theme_settings (settings_key, day, night, is_active)
values (
 'global',
 '{
  "colors":{"earth":"#6b4f2a","earthDark":"#4d3820","leaf":"#3f6f3a","leafDark":"#2f5630","paddy":"#8a9a3b","field":"#e8edcf","water":"#5f8790","clay":"#b87952","sun":"#c49a3a","page":"transparent","surface":"rgb(255 250 240 / .92)","surfaceSoft":"rgb(238 227 201 / .90)","text":"#302b20","muted":"#716955","border":"#cdbf9f","focus":"#7b5b24","shadow":"rgb(77 56 32 / .12)","header":"rgb(255 250 240 / .92)","footer":"rgb(238 227 201 / .94)","input":"rgb(255 250 240 / .96)","hover":"#e8edcf"},
  "states":{"success":"#3f6f3a","warning":"#b87952","error":"#a84d3f","info":"#5f8790"},
  "interaction":{"hoverOpacity":"1","activeOpacity":"1","disabledOpacity":".6"},
  "shape":{"radius":".4rem","buttonRadius":".35rem","borderWidth":"1px"},
  "shadow":{"card":"0 3px 14px rgb(77 56 32 / .12)","dropdown":"0 8px 24px rgb(77 56 32 / .16)","modal":"0 12px 36px rgb(77 56 32 / .20)"},
  "typography":{"headingWeight":"800","bodyWeight":"400","lineHeight":"1.55"},
  "scrollbar":{"thumb":"#9b8a69","track":"#eee3c9"}
 }'::jsonb,
 '{
  "colors":{"earth":"#b9905e","earthDark":"#e5c58f","leaf":"#6f9b5d","leafDark":"#a9c98f","paddy":"#a9b85a","field":"#293728","water":"#6e9ba2","clay":"#c48861","sun":"#d4ae58","page":"transparent","surface":"rgb(29 39 29 / .96)","surfaceSoft":"rgb(40 52 38 / .96)","text":"#eee8d9","muted":"#b9b8a7","border":"#4e5b46","focus":"#e0bd6b","shadow":"rgb(0 0 0 / .38)","header":"rgb(20 29 20 / .96)","footer":"rgb(27 37 27 / .97)","input":"rgb(24 34 24 / .98)","hover":"#344532"},
  "states":{"success":"#78a866","warning":"#d4ae58","error":"#d77b6f","info":"#79aeb5"},
  "interaction":{"hoverOpacity":"1","activeOpacity":"1","disabledOpacity":".55"},
  "shape":{"radius":".4rem","buttonRadius":".35rem","borderWidth":"1px"},
  "shadow":{"card":"0 3px 14px rgb(0 0 0 / .38)","dropdown":"0 8px 24px rgb(0 0 0 / .48)","modal":"0 12px 36px rgb(0 0 0 / .58)"},
  "typography":{"headingWeight":"800","bodyWeight":"400","lineHeight":"1.55"},
  "scrollbar":{"thumb":"#66745f","track":"#202a20"}
 }'::jsonb,
 true
)
on conflict (settings_key) do nothing;