drop policy if exists "Public can record visits" on public.site_visits;

create policy "Anyone can record visits"
on public.site_visits
for insert
to anon, authenticated
with check (
  visitor_id is not null
  and length(visitor_id) <= 200
  and page_path is not null
  and length(page_path) <= 1000
);

drop policy if exists "Admins can read visits" on public.site_visits;

create policy "Admins can read visits"
on public.site_visits
for select
to authenticated
using (public.is_admin());
