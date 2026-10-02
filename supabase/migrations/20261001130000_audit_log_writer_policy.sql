drop policy if exists audit_logs_admin_insert on public.audit_logs;

create policy audit_logs_authenticated_insert on public.audit_logs for insert to authenticated with check (actor_profile_id = auth.uid());