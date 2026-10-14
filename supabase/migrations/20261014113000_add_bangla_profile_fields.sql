-- Add optional Bangla profile fields while preserving existing English fields and data.
alter table public.profiles
  add column if not exists full_name_bn text,
  add column if not exists bio_bn text;

comment on column public.profiles.full_name_bn is 'Bangla display name for the user profile.';
comment on column public.profiles.bio_bn is 'Bangla biography for the user profile.';
