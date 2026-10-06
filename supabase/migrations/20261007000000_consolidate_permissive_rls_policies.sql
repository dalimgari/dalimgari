-- Consolidate equivalent permissive RLS policies to reduce policy evaluation overhead.

drop policy if exists posts_owner_update on public.posts;
drop policy if exists posts_admin_update on public.posts;
create policy posts_update on public.posts
  for update to authenticated
  using ((select private.is_admin()) or (select auth.uid()) = user_id)
  with check ((select private.is_admin()) or (select auth.uid()) = user_id);

drop policy if exists posts_owner_delete on public.posts;
drop policy if exists posts_admin_delete on public.posts;
create policy posts_delete on public.posts
  for delete to authenticated
  using ((select private.is_admin()) or (select auth.uid()) = user_id);

drop policy if exists profiles_self_select on public.profiles;
drop policy if exists profiles_admin_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using ((select private.is_admin()) or id = (select auth.uid()));
