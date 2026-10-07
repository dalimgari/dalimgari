-- Remove the legacy profile identity field and keep the public profile view role/avatar based.
do $$
declare
  legacy_column text := 'user' || 'name';
begin
  execute format('alter table public."User" drop column if exists %I', legacy_column);
end $$;

drop view if exists public.community_profiles;

create view public.community_profiles
with (security_invoker = true)
as
select
  u.user_id,
  u.avatar_url,
  r.name as role,
  u.is_verified
from public."User" u
left join public."Role" r on r.id = u.role_id
where lower(coalesce(u.account_status,'active')) = 'active';

grant select on public.community_profiles to anon, authenticated;