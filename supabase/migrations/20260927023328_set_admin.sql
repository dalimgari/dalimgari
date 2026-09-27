insert into public.user_roles (user_id, role)
values ('4b7f7da0-c3b8-49fd-9931-2b1d284515e3', 'admin')
on conflict (user_id)
do update set role = 'admin';