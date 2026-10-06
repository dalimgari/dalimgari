-- Performance and RLS policy hardening
-- Applied to the production Supabase project before committing this migration.

drop policy if exists posts_owner_delete on public.posts;
create policy posts_owner_delete on public.posts
  for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists posts_owner_insert on public.posts;
create policy posts_owner_insert on public.posts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists posts_owner_update on public.posts;
create policy posts_owner_update on public.posts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists profiles_admin_update on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using ((select private.is_admin()) or id = (select auth.uid()))
  with check ((select private.is_admin()) or id = (select auth.uid()));

-- These indexes duplicate the leading column(s) of their composite primary keys.
drop index if exists public.user_roles_user_id_idx;
drop index if exists public.role_permissions_role_id_idx;
drop index if exists public.user_permissions_user_id_idx;


drop policy if exists posts_admin_update on public.posts;
create policy posts_admin_update on public.posts
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists posts_admin_delete on public.posts;
create policy posts_admin_delete on public.posts
  for delete to authenticated
  using ((select private.is_admin()));
