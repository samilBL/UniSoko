create table if not exists public.hostel_listings (
  id uuid primary key default gen_random_uuid(),
  campus_id text not null,
  campus_name text not null,
  title text not null check (char_length(title) between 3 and 140),
  address text not null check (char_length(address) between 3 and 300),
  description text not null default '',
  price_per_term numeric(12, 2) not null check (price_per_term > 0),
  distance_km numeric(7, 2) not null check (distance_km >= 0),
  amenities text[] not null default '{}',
  photo_paths text[] not null default '{}',
  status text not null default 'Draft' check (status in ('Draft', 'Published', 'Archived')),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hostel_listings_published_idx
  on public.hostel_listings (campus_id, price_per_term)
  where status = 'Published' and verified = true;

alter table public.hostel_listings enable row level security;
revoke all on public.hostel_listings from anon, authenticated;
grant all on public.hostel_listings to service_role;

create table if not exists public.room_bounty_submissions (
  id uuid primary key default gen_random_uuid(),
  student_name text not null check (char_length(student_name) between 2 and 120),
  phone text not null check (char_length(phone) between 7 and 32),
  university text not null check (char_length(university) between 2 and 180),
  location text not null check (char_length(location) between 4 and 300),
  landlord_name text not null default '',
  landlord_phone text not null default '',
  details text not null check (char_length(details) between 5 and 1500),
  bounty_amount numeric(12, 2) not null default 0 check (bounty_amount >= 0),
  status text not null default 'Pending' check (status in ('Pending', 'Verifying', 'Leased', 'Rejected')),
  payout_status text not null default 'Not Due' check (payout_status in ('Not Due', 'Due', 'Paid')),
  submitted_at timestamptz not null default now(),
  leased_at timestamptz,
  paid_at timestamptz,
  admin_notes text not null default '',
  constraint room_bounty_paid_requires_lease check (payout_status <> 'Paid' or status = 'Leased'),
  constraint room_bounty_due_requires_amount check (payout_status <> 'Due' or (status = 'Leased' and bounty_amount > 0))
);

create index if not exists room_bounty_status_submitted_idx
  on public.room_bounty_submissions (status, submitted_at desc);

alter table public.room_bounty_submissions enable row level security;
revoke all on public.room_bounty_submissions from anon, authenticated;
grant all on public.room_bounty_submissions to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hostel-photos', 'hostel-photos', false, 5000000, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5000000, allowed_mime_types = excluded.allowed_mime_types;
