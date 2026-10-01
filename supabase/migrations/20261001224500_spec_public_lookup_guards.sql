-- Master Specification integrity guards.
-- Explicit public lookup indexes and sitemap RPC execution grants.

begin;

create index if not exists posts_public_lookup_idx
  on public.posts (published_at desc)
  where status = 'published' and is_visible = true;

create index if not exists pages_public_lookup_idx
  on public.pages (updated_at desc)
  where status = 'published' and is_visible = true;

create index if not exists media_public_lookup_idx
  on public.media (created_at desc)
  where is_visible = true;

revoke all on function public.get_public_sitemap_content() from public;
grant execute on function public.get_public_sitemap_content() to anon, authenticated;

commit;
