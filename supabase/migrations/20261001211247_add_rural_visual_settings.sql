create table if not exists public.rural_visual_settings (
  visual_settings_id uuid primary key default extensions.gen_random_uuid(),
  settings_key text not null unique default 'global',
  wallpaper_url text,
  wallpaper_mobile_url text,
  wallpaper_overlay text,
  wallpaper_position text not null default 'center center',
  wallpaper_size text not null default 'cover',
  icon_set jsonb not null default '{}'::jsonb,
  text_styles jsonb not null default '{}'::jsonb,
  component_styles jsonb not null default '{}'::jsonb,
  custom_css jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rural_visual_settings enable row level security;

create policy rural_visual_settings_public_read on public.rural_visual_settings
  for select to anon, authenticated using (is_active = true);

create policy rural_visual_settings_admin_insert on public.rural_visual_settings
  for insert to authenticated
  with check (private.has_permission('settings_manage'::text));

create policy rural_visual_settings_admin_update on public.rural_visual_settings
  for update to authenticated
  using (private.has_permission('settings_manage'::text))
  with check (private.has_permission('settings_manage'::text));

create policy rural_visual_settings_admin_delete on public.rural_visual_settings
  for delete to authenticated
  using (private.has_permission('settings_manage'::text));

create index if not exists rural_visual_settings_active_idx on public.rural_visual_settings (is_active) where is_active = true;

insert into public.rural_visual_settings (settings_key, wallpaper_url, wallpaper_mobile_url, wallpaper_overlay, icon_set, text_styles, component_styles)
values ('global', '/assets/rural-bengal-wallpaper.svg', '/assets/rural-bengal-wallpaper.svg', 'natural', '{"menu_open":"উঠান খুলুন","menu_close":"উঠান গুটান","search":"খোঁজ","home":"বাড়ি","login":"ঘরে ঢোকা","back":"পেছনের পথে"}'::jsonb, '{"heading_font":"Noto Serif Bengali","body_font":"Noto Sans Bengali","heading_weight":800,"letter_spacing":"0.005em"}'::jsonb, '{"radius":".35rem","surface":"paper","shadow":"soft-earth"}'::jsonb)
on conflict (settings_key) do nothing;

create or replace function public.set_rural_visual_settings_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists rural_visual_settings_updated_at on public.rural_visual_settings;
create trigger rural_visual_settings_updated_at before update on public.rural_visual_settings for each row execute function public.set_rural_visual_settings_updated_at();