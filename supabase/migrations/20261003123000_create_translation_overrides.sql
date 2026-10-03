create table if not exists public.translation_overrides (
  source_text text primary key,
  english_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint translation_overrides_source_text_check check (btrim(source_text) <> ''),
  constraint translation_overrides_english_text_check check (btrim(english_text) <> '')
);

alter table public.translation_overrides enable row level security;

drop policy if exists translation_overrides_public_read on public.translation_overrides;
create policy translation_overrides_public_read
  on public.translation_overrides
  for select
  to anon, authenticated
  using (true);

drop policy if exists translation_overrides_admin_insert on public.translation_overrides;
create policy translation_overrides_admin_insert
  on public.translation_overrides
  for insert
  to authenticated
  with check (private.has_permission('settings_manage'::text));

drop policy if exists translation_overrides_admin_update on public.translation_overrides;
create policy translation_overrides_admin_update
  on public.translation_overrides
  for update
  to authenticated
  using (private.has_permission('settings_manage'::text))
  with check (private.has_permission('settings_manage'::text));

drop policy if exists translation_overrides_admin_delete on public.translation_overrides;
create policy translation_overrides_admin_delete
  on public.translation_overrides
  for delete
  to authenticated
  using (private.has_permission('settings_manage'::text));