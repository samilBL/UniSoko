create table if not exists public.student_bundles (
  id text primary key,
  title text not null check (char_length(title) between 2 and 140),
  course text not null check (char_length(course) between 2 and 120),
  description text not null default '' check (char_length(description) <= 600),
  list_price numeric(12, 2) not null check (list_price > 0),
  bundle_price numeric(12, 2) not null check (bundle_price > 0 and bundle_price <= list_price),
  discount_percent numeric(5, 2) not null check (discount_percent between 0 and 100),
  status text not null default 'Draft' check (status in ('Draft', 'Published', 'Archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_bundles_published_course_idx
  on public.student_bundles (course, bundle_price)
  where status = 'Published';

create table if not exists public.student_bundle_items (
  bundle_id text not null references public.student_bundles(id) on delete cascade,
  product_id text not null,
  product_title text not null,
  quantity integer not null default 1 check (quantity between 1 and 20),
  unit_price numeric(12, 2) not null check (unit_price > 0),
  sort_order smallint not null default 0,
  primary key (bundle_id, product_id)
);

alter table public.student_bundles enable row level security;
alter table public.student_bundle_items enable row level security;
revoke all on public.student_bundles, public.student_bundle_items from anon, authenticated;
grant all on public.student_bundles, public.student_bundle_items to service_role;

insert into public.student_bundles (id, title, course, description, list_price, bundle_price, discount_percent, status)
values
  ('bundle-first-year-room', 'First-Year Room Essentials', 'First-Year Room', 'A coordinated starter setup for a comfortable student room.', 610000, 549000, 10, 'Published'),
  ('bundle-computer-science-bscs', 'Computer Science / BSCS Pack', 'Computer Science / BSCS', 'A refurbished laptop plus the core accessories for coding, coursework, and online classes.', 811000, 729900, 10, 'Published')
on conflict (id) do nothing;

insert into public.student_bundle_items (bundle_id, product_id, product_title, quantity, unit_price, sort_order)
values
  ('bundle-first-year-room', 'prod-room-bedframe', 'Compact Single Student Bed Frame', 1, 320000, 1),
  ('bundle-first-year-room', 'prod-room-fan', 'Portable Quiet Desk Fan for Dorm Rooms', 1, 65000, 2),
  ('bundle-first-year-room', 'prod-room-mattress', 'Single Student Mattress with Washable Cover', 1, 180000, 3),
  ('bundle-first-year-room', 'prod-room-desk-lamp', 'Adjustable LED Student Desk Lamp with USB Port', 1, 45000, 4),
  ('bundle-computer-science-bscs', 'prod-hp-elitebook-840-g6', 'HP EliteBook 840 G6 (Core i5 8th Gen, 16GB RAM, 256GB NVMe SSD)', 1, 650000, 1),
  ('bundle-computer-science-bscs', 'prod-laptop-stand', 'Adjustable Aluminum Laptop Stand', 1, 48000, 2),
  ('bundle-computer-science-bscs', 'prod-studio-ringlight-10inch', '10" LED Multi-Color Studio Ring Light + 1.6m Metal Tripod', 1, 48000, 3),
  ('bundle-computer-science-bscs', 'prod-powerbank-20000mah', 'Oraimo 20,000mAh PowerPro 22.5W Fast Charge Power Bank', 1, 65000, 4)
on conflict (bundle_id, product_id) do nothing;
