alter table public.managed_links
  add column if not exists link_key text,
  add column if not exists display_order integer not null default 0;

with numbered as (
  select link_id,
         'link_' || row_number() over (order by created_at, link_id) as generated_key,
         row_number() over (order by created_at, link_id) as generated_order
  from public.managed_links
)
update public.managed_links ml
set link_key = numbered.generated_key,
    display_order = numbered.generated_order
from numbered
where ml.link_id = numbered.link_id
  and ml.link_key is null;

alter table public.managed_links
  alter column link_key set not null;

create unique index if not exists managed_links_link_key_key on public.managed_links(link_key);
create unique index if not exists managed_links_display_order_key on public.managed_links(display_order);
