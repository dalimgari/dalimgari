-- Keep anonymous reads public-only; permission-gated reads are authenticated-only.
begin;
drop policy if exists content_public_read on public.pages;
drop policy if exists content_authenticated_select on public.pages;

create policy content_public_read
  on public.pages
  for select
  to anon
  using (visibility = 'public');

create policy content_authenticated_select
  on public.pages
  for select
  to authenticated
  using (
    visibility = 'public'
    or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
    or (select private.has_permission('content.view'))
  );
commit;
