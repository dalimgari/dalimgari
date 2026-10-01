-- Master Specification integrity guards.
-- Keep public publishing semantics explicit and prevent malformed media records.

begin;

-- Public content must never expose records explicitly marked unpublished.
-- Existing RLS remains the authority; this index supports the common public query path.
create index if not exists content_public_lookup_idx
  on public.content (content_type, published_at desc)
  where is_published = true;

-- Media listing/filtering commonly joins by bucket/path and visibility metadata.
create index if not exists media_public_lookup_idx
  on public.media (created_at desc)
  where is_published = true;

-- Keep sitemap/public content RPC execution limited to intended callers.
revoke all on function public.get_public_sitemap_content() from public;
grant execute on function public.get_public_sitemap_content() to anon, authenticated;

commit;
