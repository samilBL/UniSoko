create table if not exists public.advertising_inquiries (
  id uuid primary key default gen_random_uuid(),
  business_name text not null check (char_length(business_name) between 1 and 160),
  contact_person text not null default '',
  phone text not null check (char_length(phone) between 1 and 40),
  email text not null default '',
  target_campuses text[] not null default '{}',
  package_type text not null default 'Homepage Spotlight',
  campaign_title text not null default '',
  creative_url text not null default '',
  destination_url text not null default '',
  duration_weeks integer not null default 1 check (duration_weeks between 1 and 4),
  budget text not null default '',
  notes text not null default '',
  amount_due integer not null default 0 check (amount_due >= 0),
  payment_method_id uuid,
  transaction_reference text,
  payment_status text not null default 'Not Submitted' check (payment_status in ('Not Submitted', 'Submitted', 'Verified', 'Rejected')),
  payment_reviewed_at timestamptz,
  payment_reviewed_by text,
  payment_rejection_reason text not null default '',
  campaign_status text not null default 'Draft' check (campaign_status in ('Draft', 'Under Review', 'Scheduled', 'Active', 'Completed', 'Rejected')),
  campaign_start_at timestamptz,
  campaign_end_at timestamptz,
  status text not null default 'Pending Payment Verification' check (status in ('Pending Payment Verification', 'Payment Rejected', 'Campaign Submitted', 'Approved', 'Rejected', 'Completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade deployments that already have the original enquiry-only table.
alter table public.advertising_inquiries add column if not exists campaign_title text not null default '';
alter table public.advertising_inquiries add column if not exists creative_url text not null default '';
alter table public.advertising_inquiries add column if not exists destination_url text not null default '';
alter table public.advertising_inquiries add column if not exists duration_weeks integer not null default 1;
alter table public.advertising_inquiries add column if not exists amount_due integer not null default 0;
alter table public.advertising_inquiries add column if not exists payment_method_id uuid;
alter table public.advertising_inquiries add column if not exists transaction_reference text;
alter table public.advertising_inquiries add column if not exists payment_status text not null default 'Not Submitted';
alter table public.advertising_inquiries add column if not exists payment_reviewed_at timestamptz;
alter table public.advertising_inquiries add column if not exists payment_reviewed_by text;
alter table public.advertising_inquiries add column if not exists payment_rejection_reason text not null default '';
alter table public.advertising_inquiries add column if not exists campaign_status text not null default 'Draft';
alter table public.advertising_inquiries add column if not exists campaign_start_at timestamptz;
alter table public.advertising_inquiries add column if not exists campaign_end_at timestamptz;
alter table public.advertising_inquiries add column if not exists status text not null default 'Pending Payment Verification';
alter table public.advertising_inquiries add column if not exists updated_at timestamptz not null default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'advertising_inquiries_duration_weeks_check') then
    alter table public.advertising_inquiries add constraint advertising_inquiries_duration_weeks_check check (duration_weeks between 1 and 4);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'advertising_inquiries_amount_due_check') then
    alter table public.advertising_inquiries add constraint advertising_inquiries_amount_due_check check (amount_due >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'advertising_inquiries_payment_status_check') then
    alter table public.advertising_inquiries add constraint advertising_inquiries_payment_status_check check (payment_status in ('Not Submitted', 'Submitted', 'Verified', 'Rejected'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'advertising_inquiries_campaign_status_check') then
    alter table public.advertising_inquiries add constraint advertising_inquiries_campaign_status_check check (campaign_status in ('Draft', 'Under Review', 'Scheduled', 'Active', 'Completed', 'Rejected'));
  end if;
end $$;

alter table public.advertising_inquiries enable row level security;
revoke all on public.advertising_inquiries from anon, authenticated;
create index if not exists advertising_inquiries_created_at_idx on public.advertising_inquiries (created_at desc);
create unique index if not exists advertising_inquiries_transaction_reference_idx on public.advertising_inquiries (transaction_reference) where transaction_reference is not null;
