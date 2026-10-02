-- Seed the UI labels required by the Key Label Management admin module.
-- Additive and idempotent: existing customized values are preserved.

insert into public.global_ui_labels (key, eng, bng) values
  ('key_label_management', 'Key Label Management', 'লেবেল ব্যবস্থাপনা'),
  ('key_label_rename', 'Key Label Rename', 'লেবেল বদল'),
  ('key_name', 'Key Name', 'Key নাম'),
  ('english_label', 'English Label', 'ইংরেজি নাম'),
  ('bangla_label', 'Bangla Label', 'বাংলা নাম')
on conflict (key) do nothing;
