insert into public.site_tabs
  (tab_key, title_bn, title_en, content_type, sort_order, enabled)
values
  ('home', 'হোম', 'Home', 'home', 0, true),
  ('news', 'খবর', 'News', 'news', 10, true),
  ('events', 'ইভেন্ট', 'Events', 'events', 20, true),
  ('gallery', 'গ্যালারি', 'Gallery', 'gallery', 30, true),
  ('videos', 'ভিডিও', 'Videos', 'video', 40, true)
on conflict (tab_key) do update set
  title_bn = excluded.title_bn,
  title_en = excluded.title_en,
  content_type = excluded.content_type,
  sort_order = excluded.sort_order,
  enabled = excluded.enabled,
  updated_at = now();

insert into public.global_links
  (label, url, root_domain, icon, enabled, sort_order)
values
  ('Dalimgari', '/', 'dalimgari', 'home', true, 0)
on conflict do nothing;
