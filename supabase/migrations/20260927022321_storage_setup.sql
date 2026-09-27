insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update
set public = true;