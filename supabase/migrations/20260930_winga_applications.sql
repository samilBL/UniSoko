create table if not exists public.winga_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null,
  university text not null check (char_length(university) between 2 and 160),
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  promo_code text unique,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint winga_approved_requires_code check (status <> 'Approved' or promo_code is not null)
);

create index if not exists winga_applications_status_submitted_idx
  on public.winga_applications (status, submitted_at desc);

alter table public.winga_applications enable row level security;
revoke all on public.winga_applications from anon, authenticated;
grant all on public.winga_applications to service_role;

comment on table public.winga_applications is
  'UniSoko agent applications. Wingas are agents, not sellers; access is mediated by authenticated server routes.';