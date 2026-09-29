-- Authentication security hardening.
-- Leaked-password protection must be enabled from the Supabase Auth dashboard.
-- This migration documents the required database-side security state.

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_permissions enable row level security;
