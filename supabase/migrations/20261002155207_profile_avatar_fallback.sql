create table if not exists public.profile_avatar_settings (
  id text primary key check (id = 'default'),
  avatar_svg text not null,
  updated_at timestamptz not null default now()
);

alter table public.profile_avatar_settings enable row level security;

drop policy if exists "profile avatar default is publicly readable" on public.profile_avatar_settings;
create policy "profile avatar default is publicly readable"
  on public.profile_avatar_settings
  for select
  to anon, authenticated
  using (true);

insert into public.profile_avatar_settings (id, avatar_svg)
values (
  'default',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f6f4e"/><stop offset="1" stop-color="#7aa66f"/></linearGradient></defs><circle cx="128" cy="128" r="128" fill="url(#bg)"/><circle cx="128" cy="96" r="42" fill="#fff" fill-opacity=".95"/><path d="M52 220c10-52 39-78 76-78s66 26 76 78" fill="#fff" fill-opacity=".95"/></svg>'
)
on conflict (id) do update set avatar_svg = excluded.avatar_svg, updated_at = now();