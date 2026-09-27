create policy "Anyone can view site settings"
on public.site_settings
for select
to anon, authenticated
using (true);
