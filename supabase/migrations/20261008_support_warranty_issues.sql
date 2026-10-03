-- Migration: support_tickets, warranty_claims, operational_issues
-- Apply in Supabase SQL editor. All tables are service-role only.

-- CUSTOMER SUPPORT TICKETS
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  order_id text references public.orders(id) on delete set null,
  buyer_name text not null check (char_length(buyer_name) between 1 and 200),
  buyer_phone text not null check (char_length(buyer_phone) between 5 and 30),
  subject text not null check (subject in (
    'Payment', 'Delivery', 'Wrong product', 'Damaged product',
    'Warranty', 'Return', 'Cancellation', 'Other'
  )),
  message text not null check (char_length(message) between 5 and 2000),
  status text not null default 'Open' check (status in (
    'Open', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed'
  )),
  admin_notes text not null default '' check (char_length(admin_notes) <= 3000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_status_created_idx
  on public.support_tickets (status, created_at desc);
create index if not exists support_tickets_order_id_idx
  on public.support_tickets (order_id);

alter table public.support_tickets enable row level security;
revoke all on public.support_tickets from anon, authenticated;
grant all on public.support_tickets to service_role;

-- WARRANTY CLAIMS / RETURNS
create table if not exists public.warranty_claims (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  buyer_name text not null check (char_length(buyer_name) between 1 and 200),
  buyer_phone text not null check (char_length(buyer_phone) between 5 and 30),
  claim_type text not null check (claim_type in ('Warranty', 'Return', 'Damaged', 'Wrong item')),
  description text not null check (char_length(description) between 5 and 2000),
  status text not null default 'Submitted' check (status in (
    'Submitted', 'Under Review', 'Return Received', 'Inspecting', 'Resolved', 'Rejected'
  )),
  resolution text check (resolution in ('Replacement', 'Repair', 'Refund', 'Rejected')),
  admin_notes text not null default '' check (char_length(admin_notes) <= 3000),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  resolved_at timestamptz
);

create index if not exists warranty_claims_status_submitted_idx
  on public.warranty_claims (status, submitted_at desc);
create index if not exists warranty_claims_order_id_idx
  on public.warranty_claims (order_id);

alter table public.warranty_claims enable row level security;
revoke all on public.warranty_claims from anon, authenticated;
grant all on public.warranty_claims to service_role;

-- ADMIN OPERATIONAL ISSUES QUEUE
create table if not exists public.operational_issues (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in (
    'Payment', 'Delivery', 'Refund', 'Winga dispute',
    'Inventory', 'Trade-in', 'Support', 'Other'
  )),
  title text not null check (char_length(title) between 3 and 300),
  description text not null check (char_length(description) between 5 and 3000),
  related_id text check (char_length(related_id) <= 200),
  status text not null default 'Open' check (status in (
    'Open', 'Investigating', 'Waiting', 'Resolved', 'Closed'
  )),
  assigned_to text check (char_length(assigned_to) <= 120),
  internal_notes text not null default '' check (char_length(internal_notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists operational_issues_status_created_idx
  on public.operational_issues (status, created_at desc);

alter table public.operational_issues enable row level security;
revoke all on public.operational_issues from anon, authenticated;
grant all on public.operational_issues to service_role;
