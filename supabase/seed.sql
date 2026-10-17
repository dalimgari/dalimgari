-- Optional public-content seed for a newly prepared Dalimgari database.
-- Content is based only on community oral-history details supplied by the site owner.
-- Do not run before the schema migrations have created public.pages.

insert into public.pages
  (title, title_en, description, description_en, content, content_en, url, visibility)
values
  (
    'Village History',
    'Village History',
    'An introduction to Dalimgari based on local oral history.',
    'An introduction to Dalimgari based on local oral history.',
    '<p>The early history of Dalimgari is preserved mainly through local oral accounts. According to local belief, the people who first settled here came from neighbouring villages. The identity of the first founder or founders is not known with certainty.</p><p>These accounts are part of the community''s remembered history. Further details should be added only when supported by reliable local records or additional testimony.</p>',
    '<p>The early history of Dalimgari is preserved mainly through local oral accounts. According to local belief, the people who first settled here came from neighbouring villages. The identity of the first founder or founders is not known with certainty.</p><p>These accounts are part of the community''s remembered history. Further details should be added only when supported by reliable local records or additional testimony.</p>',
    'village-history',
    'public'
  ),
  (
    'Early Settlement',
    'Early Settlement',
    'What is known and what remains uncertain about Dalimgari''s beginnings.',
    'What is known and what remains uncertain about Dalimgari''s beginnings.',
    '<p>Local tradition holds that early settlers came to Dalimgari from nearby villages. The available oral history does not identify a confirmed founder or a precise settlement date.</p><p>This page deliberately distinguishes community tradition from verified historical records. Additional evidence can be added by an administrator when it becomes available.</p>',
    '<p>Local tradition holds that early settlers came to Dalimgari from nearby villages. The available oral history does not identify a confirmed founder or a precise settlement date.</p><p>This page deliberately distinguishes community tradition from verified historical records. Additional evidence can be added by an administrator when it becomes available.</p>',
    'early-settlement',
    'public'
  ),
  (
    'The Name Dalimgari',
    'The Name Dalimgari',
    'A local story connects the village name with a pomegranate offered during a visit.',
    'A local story connects the village name with a pomegranate offered during a visit.',
    '<p>According to a local naming story, village elders invited the Islamic figure Syed Wazed (RA) when they were seeking recognition or a name for the settlement. During the visit, a pomegranate was served. The oral tradition connects the word for pomegranate, “dalim”, with the name Dalimgari.</p><p>This account is presented as a community story rather than a fully verified documentary record.</p>',
    '<p>According to a local naming story, village elders invited the Islamic figure Syed Wazed (RA) when they were seeking recognition or a name for the settlement. During the visit, a pomegranate was served. The oral tradition connects the word for pomegranate, “dalim”, with the name Dalimgari.</p><p>This account is presented as a community story rather than a fully verified documentary record.</p>',
    'the-name-dalimgari',
    'public'
  ),
  (
    'Dalimgari and the Liberation War',
    'Dalimgari and the Liberation War',
    'Elders remember Dalimgari as an established village during the 1971 Liberation War.',
    'Elders remember Dalimgari as an established village during the 1971 Liberation War.',
    '<p>According to accounts shared by village elders, Dalimgari was already an established village during the Bangladesh Liberation War in 1971. Elders also recall that many people from the village participated in the war directly or supported it indirectly.</p><p>Individual names, dates, and specific events should be added only after they have been confirmed with reliable testimony or historical records.</p>',
    '<p>According to accounts shared by village elders, Dalimgari was already an established village during the Bangladesh Liberation War in 1971. Elders also recall that many people from the village participated in the war directly or supported it indirectly.</p><p>Individual names, dates, and specific events should be added only after they have been confirmed with reliable testimony or historical records.</p>',
    'dalimgari-liberation-war',
    'public'
  )
on conflict (url) do nothing;
