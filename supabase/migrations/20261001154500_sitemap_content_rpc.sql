-- Keep sitemap generation reproducible with the live database contract.
-- The RPC exposes only public, published, visible content identifiers.
create or replace function public.get_sitemap_content()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'posts', coalesce((
      select jsonb_agg(jsonb_build_object('post_id', p.post_id) order by p.post_id)
      from public.posts p
      where p.status = 'published'
        and p.is_visible = true
    ), '[]'::jsonb),
    'pages', coalesce((
      select jsonb_agg(jsonb_build_object('page_slug', pg.page_slug) order by pg.page_slug)
      from public.pages pg
      where pg.status = 'published'
        and pg.is_visible = true
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_sitemap_content() from public;
grant execute on function public.get_sitemap_content() to anon, authenticated;
