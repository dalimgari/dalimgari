-- Avoid per-row auth function evaluation in pages RLS policies.
begin;
alter policy content_public_read on public.pages
using (
  visibility = 'public'
  or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
  or (select private.has_permission('content.view'))
);
alter policy content_role_delete on public.pages
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
  or (select private.has_permission('content.delete'))
);
alter policy content_role_insert on public.pages
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
  or (select private.has_permission('content.create'))
);
alter policy content_role_update on public.pages
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
  or (select private.has_permission('content.edit'))
)
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
  or (select private.has_permission('content.edit'))
);
commit;
