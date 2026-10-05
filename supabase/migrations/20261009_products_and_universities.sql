-- Migration: products and universities
-- Apply in Supabase SQL editor. All tables service_role only.

-- 1. UNIVERSITIES & CAMPUSES TABLE
create table if not exists public.universities (
  id text primary key,
  name text not null check (char_length(name) between 2 and 200),
  short_name text not null check (char_length(short_name) between 2 and 50),
  city text not null check (char_length(city) between 2 and 100),
  is_active boolean not null default true,
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  estimated_delivery_time text not null default 'Same-day delivery (under 2 hrs)',
  hostels jsonb not null default '[]'::jsonb,
  landmarks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.universities enable row level security;
revoke all on public.universities from anon, authenticated;
grant all on public.universities to service_role;

-- 2. PRODUCTS TABLE
create table if not exists public.products (
  id text primary key,
  name text not null check (char_length(name) between 2 and 300),
  category text not null check (char_length(category) between 2 and 100),
  price numeric(10, 2) not null check (price >= 0),
  original_price numeric(10, 2) check (original_price is null or original_price >= 0),
  wholesale_price numeric(10, 2) check (wholesale_price is null or wholesale_price >= 0),
  wholesale_min_qty integer not null default 3 check (wholesale_min_qty >= 1),
  image text not null,
  images jsonb not null default '[]'::jsonb,
  rating numeric(3, 2) not null default 5.0 check (rating between 1.0 and 5.0),
  reviews_count integer not null default 0 check (reviews_count >= 0),
  badge text,
  in_stock boolean not null default true,
  stock_count integer not null default 10 check (stock_count >= 0),
  description text not null default '',
  specs jsonb not null default '[]'::jsonb,
  is_featured boolean not null default false,
  is_bundle_eligible boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category);
create index if not exists products_is_active_idx on public.products(is_active);

alter table public.products enable row level security;
revoke all on public.products from anon, authenticated;
grant all on public.products to service_role;
