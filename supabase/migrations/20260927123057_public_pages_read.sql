create policy "Anyone can view published pages"
on public.pages
for select
to anon, authenticated
using (published = true);
