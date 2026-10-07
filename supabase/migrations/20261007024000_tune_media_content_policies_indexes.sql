-- Tune post visibility policies and album foreign-key lookup
drop policy if exists posts_authenticated_read on public.posts;
create index if not exists posts_album_id_idx on public.posts(album_id);
