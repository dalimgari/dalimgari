-- Master Specification data integrity checks.
-- Keep user-entered numeric data within the domain expected by the UI.

begin;

alter table public.website_information
  drop constraint if exists website_information_population_nonnegative;

alter table public.website_information
  add constraint website_information_population_nonnegative
  check (population is null or population >= 0);

alter table public.media
  drop constraint if exists media_file_size_valid;

alter table public.media
  add constraint media_file_size_valid
  check (file_size is null or (file_size >= 0 and file_size <= 52428800));

commit;
