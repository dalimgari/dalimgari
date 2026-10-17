-- Keep built-in widget titles in English so no Bengali UI text is rendered.
update public.widgets
set title = case widget_type
  when 'datetime' then 'Date & Time'
  when 'map' then 'Map'
  else title
end,
updated_at = now()
where title ~ U&'[\0980-\09FF]';
