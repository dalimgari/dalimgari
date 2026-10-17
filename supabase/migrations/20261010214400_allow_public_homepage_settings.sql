drop policy if exists public_read_homepage_customization on public.site_customizations;
create policy public_read_homepage_customization on public.site_customizations
for select to anon, authenticated
using (key in ('home_hero','home_page_order','home_page_includes'));
