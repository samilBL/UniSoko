create table if not exists public.admin_audit_logs (
  id bigint generated always as identity primary key,
  actor text not null check (char_length(actor) between 1 and 120),
  action text not null check (char_length(action) between 2 and 100),
  resource_type text not null check (char_length(resource_type) between 2 and 80),
  resource_id text not null check (char_length(resource_id) between 1 and 160),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_resource_idx on public.admin_audit_logs (resource_type, resource_id, created_at desc);

alter table public.admin_audit_logs enable row level security;
revoke all on public.admin_audit_logs from public, anon, authenticated, service_role;
grant select, insert on public.admin_audit_logs to service_role;
grant usage, select on sequence public.admin_audit_logs_id_seq to service_role;

create or replace function public.prevent_admin_audit_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'admin audit records are append-only';
end;
$$;

drop trigger if exists admin_audit_logs_append_only on public.admin_audit_logs;
create trigger admin_audit_logs_append_only
before update or delete on public.admin_audit_logs
for each row execute function public.prevent_admin_audit_mutation();
