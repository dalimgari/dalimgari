-- Restore profile rows for existing Auth users if an earlier trigger was absent or failed.
-- Idempotent: existing profile data is never overwritten.
insert into public.profiles (id, full_name, created_at, updated_at)
select u.id,
       coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), nullif(u.raw_user_meta_data->>'name', '')),
       now(), now()
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
