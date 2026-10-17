create table if not exists public.widgets (
  id uuid primary key default gen_random_uuid(),
  widget_type text not null check (widget_type in ('datetime','map')),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  is_visible boolean not null default true,
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint widgets_widget_type_unique unique (widget_type)
);

alter table public.widgets enable row level security;

drop policy if exists widgets_public_visible_read on public.widgets;
create policy widgets_public_visible_read
  on public.widgets for select to anon
  using (is_visible = true);

drop policy if exists widgets_authenticated_read on public.widgets;
create policy widgets_authenticated_read
  on public.widgets for select to authenticated
  using (is_visible = true or private.has_permission('settings.manage'));

drop policy if exists widgets_admin_insert on public.widgets;
create policy widgets_admin_insert
  on public.widgets for insert to authenticated
  with check (private.has_permission('settings.manage'));

drop policy if exists widgets_admin_update on public.widgets;
create policy widgets_admin_update
  on public.widgets for update to authenticated
  using (private.has_permission('settings.manage'))
  with check (private.has_permission('settings.manage'));

drop policy if exists widgets_admin_delete on public.widgets;
create policy widgets_admin_delete
  on public.widgets for delete to authenticated
  using (private.has_permission('settings.manage'));

grant select on public.widgets to anon, authenticated;
grant insert, update, delete on public.widgets to authenticated;

insert into public.widgets (widget_type, title, is_visible, settings)
values
  ('datetime', 'সময় ও তারিখ', true, '{"timezone":"local","format":"full"}'::jsonb),
  ('map', 'ম্যাপ', true, '{"location":"Saudi Arabia","embed_url":"https://maps.google.com/maps?q=Saudi%20Arabia&output=embed"}'::jsonb)
on conflict (widget_type) do nothing;
