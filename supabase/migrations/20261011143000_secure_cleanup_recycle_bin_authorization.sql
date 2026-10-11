-- Records a server-only authorization secret for cleanup-recycle-bin.
-- Provision the matching secret in Supabase Vault separately during deployment.
-- Never place the actual secret value in this migration or in frontend code.

create table if not exists public.edge_function_secrets (
  name text primary key check (char_length(name) between 1 and 120),
  secret_value text not null check (char_length(secret_value) >= 32),
  created_at timestamptz not null default now()
);

alter table public.edge_function_secrets enable row level security;
revoke all on table public.edge_function_secrets from public, anon, authenticated;
grant select on table public.edge_function_secrets to service_role;

drop policy if exists edge_function_secrets_service_role_read on public.edge_function_secrets;
create policy edge_function_secrets_service_role_read
  on public.edge_function_secrets
  for select
  to service_role
  using (true);
