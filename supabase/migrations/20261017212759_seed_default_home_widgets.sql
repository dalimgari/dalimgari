insert into public.widgets (title, title_en, widget_type, is_visible, settings)
select 'Date and time', 'Date and time', 'datetime', true, '{}'::jsonb
where not exists (select 1 from public.widgets where widget_type = 'datetime');

insert into public.widgets (title, title_en, widget_type, is_visible, settings)
select 'Village map', 'Village map', 'map', true, '{}'::jsonb
where not exists (select 1 from public.widgets where widget_type = 'map');
