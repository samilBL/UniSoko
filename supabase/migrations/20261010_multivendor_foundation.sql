-- Multi-vendor marketplace foundation.
-- Additive only: existing products remain public/approved and retain their IDs.
-- All access is mediated by trusted server routes using the service-role key.

create table if not exists public.seller_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete restrict,
  display_name text not null check (char_length(display_name) between 2 and 120),
  university text not null check (char_length(university) between 2 and 160),
  campus text check (campus is null or char_length(campus) <= 160),
  description text not null default '' check (char_length(description) <= 2000),
  avatar_url text,
  contact_options jsonb not null default '{}'::jsonb check (jsonb_typeof(contact_options) = 'object'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  seller_profile_id uuid references public.seller_profiles(id) on delete restrict,
  display_name text not null check (char_length(display_name) between 2 and 120),
  university text not null check (char_length(university) between 2 and 160),
  campus text check (campus is null or char_length(campus) <= 160),
  description text not null default '' check (char_length(description) <= 2000),
  contact_options jsonb not null default '{}'::jsonb check (jsonb_typeof(contact_options) = 'object'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  review_notes text not null default '' check (char_length(review_notes) <= 2000),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists seller_applications_one_pending_per_user_idx
  on public.seller_applications(user_id) where status = 'pending';
create index if not exists seller_applications_status_submitted_idx
  on public.seller_applications(status, submitted_at desc);

create table if not exists public.seller_verifications (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null unique references public.seller_profiles(id) on delete restrict,
  status text not null default 'unverified' check (status in ('unverified', 'pending', 'verified', 'rejected', 'suspended')),
  verification_level text not null default 'none' check (char_length(verification_level) between 1 and 80),
  public_label text check (public_label is null or char_length(public_label) <= 80),
  verified_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by text,
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  slug text not null unique check (char_length(slug) between 2 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  plan_type text not null check (plan_type in ('trial', 'paid')),
  price numeric(12, 2) not null default 0 check (price >= 0),
  currency text not null default 'TZS' check (char_length(currency) = 3),
  billing_interval text not null default 'month' check (billing_interval in ('day', 'week', 'month', 'year', 'one_time')),
  duration_days integer not null check (duration_days > 0),
  product_limit integer check (product_limit is null or product_limit >= 0),
  limits jsonb not null default '{}'::jsonb check (jsonb_typeof(limits) = 'object'),
  verification_level text not null default 'none' check (char_length(verification_level) between 1 and 80),
  is_popular boolean not null default false,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_plan_features (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.subscription_plans(id) on delete cascade,
  feature_key text not null check (char_length(feature_key) between 2 and 100),
  label text not null check (char_length(label) between 2 and 160),
  description text not null default '' check (char_length(description) <= 500),
  is_enabled boolean not null default true,
  feature_value jsonb not null default 'true'::jsonb,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, feature_key)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null references public.seller_profiles(id) on delete restrict,
  plan_id uuid references public.subscription_plans(id) on delete set null,
  status text not null check (status in ('free_trial', 'pending', 'active', 'expired', 'rejected', 'cancelled')),
  plan_snapshot jsonb not null check (jsonb_typeof(plan_snapshot) = 'object'),
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  currency text not null default 'TZS' check (char_length(currency) = 3),
  starts_at timestamptz,
  expires_at timestamptz,
  approved_at timestamptz,
  approved_by text,
  rejection_reason text check (rejection_reason is null or char_length(rejection_reason) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or starts_at is null or expires_at > starts_at)
);

create index if not exists subscriptions_seller_status_idx
  on public.subscriptions(seller_profile_id, status, expires_at desc);
create unique index if not exists subscriptions_one_current_per_seller_idx
  on public.subscriptions(seller_profile_id)
  where status in ('free_trial', 'pending', 'active');

create table if not exists public.payment_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  instructions text not null check (char_length(instructions) between 1 and 4000),
  public_details jsonb not null default '{}'::jsonb check (jsonb_typeof(public_details) = 'object'),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.payment_settings.public_details is
  'Public payment instructions and account references only. Never store secrets here.';

create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete restrict,
  payment_setting_id uuid references public.payment_settings(id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'TZS' check (char_length(currency) = 3),
  payment_method_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(payment_method_snapshot) = 'object'),
  transaction_reference text check (transaction_reference is null or char_length(transaction_reference) <= 200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text,
  rejection_reason text check (rejection_reason is null or char_length(rejection_reason) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscription_payments_reference_unique_idx
  on public.subscription_payments(lower(btrim(transaction_reference)))
  where transaction_reference is not null;
create index if not exists subscription_payments_status_submitted_idx
  on public.subscription_payments(status, submitted_at desc);

create table if not exists public.marketplace_settings (
  setting_key text primary key check (char_length(setting_key) between 2 and 120),
  setting_value jsonb not null,
  description text not null default '' check (char_length(description) <= 500),
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists public.marketplace_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (char_length(slug) between 2 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Import existing catalog category labels into the configurable category table.
insert into public.marketplace_categories (name, slug)
select distinct
  trim(p.category),
  trim(both '-' from lower(regexp_replace(trim(p.category), '[^a-zA-Z0-9]+', '-', 'g')))
from public.products p
where trim(p.category) <> ''
on conflict (slug) do nothing;

create table if not exists public.marketplace_subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.marketplace_categories(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 120),
  slug text not null check (char_length(slug) between 2 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, category_id),
  unique (category_id, slug),
  unique (category_id, name)
);

create table if not exists public.product_conditions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 80),
  slug text not null unique check (char_length(slug) between 2 and 80),
  description text not null default '' check (char_length(description) <= 500),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_attributes (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.marketplace_categories(id) on delete restrict,
  subcategory_id uuid references public.marketplace_subcategories(id) on delete restrict,
  product_condition_id uuid references public.product_conditions(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 120),
  attribute_key text not null check (char_length(attribute_key) between 2 and 120),
  input_type text not null check (input_type in ('text', 'number', 'boolean', 'select', 'multiselect')),
  is_required boolean not null default false,
  is_active boolean not null default true,
  display_order integer not null default 0,
  validation_rules jsonb not null default '{}'::jsonb check (jsonb_typeof(validation_rules) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (subcategory_id is null or category_id is not null),
  foreign key (subcategory_id, category_id)
    references public.marketplace_subcategories(id, category_id) on delete restrict
);

create unique index if not exists product_attributes_scope_key_idx
  on public.product_attributes(
    coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(subcategory_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(product_condition_id, '00000000-0000-0000-0000-000000000000'::uuid),
    attribute_key
  );

create table if not exists public.product_attribute_options (
  id uuid primary key default gen_random_uuid(),
  attribute_id uuid not null references public.product_attributes(id) on delete restrict,
  value text not null check (char_length(value) between 1 and 160),
  label text not null check (char_length(label) between 1 and 160),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attribute_id, value)
);

create table if not exists public.product_attribute_values (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  attribute_id uuid not null references public.product_attributes(id) on delete restrict,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, attribute_id)
);

create index if not exists product_attribute_values_attribute_idx
  on public.product_attribute_values(attribute_id);

create table if not exists public.marketplace_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references auth.users(id) on delete set null,
  product_id text references public.products(id) on delete set null,
  seller_profile_id uuid references public.seller_profiles(id) on delete set null,
  reason text not null check (char_length(reason) between 2 and 120),
  details text not null default '' check (char_length(details) <= 2000),
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  review_notes text not null default '' check (char_length(review_notes) <= 2000),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (product_id is not null or seller_profile_id is not null)
);

insert into public.product_conditions (name, slug, description, display_order)
values
  ('Brand New', 'brand-new', 'Unused product in new condition.', 0),
  ('Used', 'used', 'Previously owned product in working condition.', 1),
  ('Refurbished', 'refurbished', 'Restored product that has been inspected and tested.', 2),
  ('Grade A Like-New', 'grade-a-like-new', 'Previously owned product in near-new condition.', 3)
on conflict (slug) do nothing;

insert into public.marketplace_settings (setting_key, setting_value, description)
values ('seller_trial_duration_days', '30'::jsonb, 'Default duration for newly approved seller trials, in days.')
on conflict (setting_key) do nothing;

create index if not exists marketplace_reports_status_created_idx
  on public.marketplace_reports(status, created_at desc);

-- Preserve existing official/admin listings as public while giving new seller
-- listings an explicit owner and moderation lifecycle.
alter table public.products
  add column if not exists seller_profile_id uuid references public.seller_profiles(id) on delete restrict,
  add column if not exists category_id uuid references public.marketplace_categories(id) on delete restrict,
  add column if not exists subcategory_id uuid references public.marketplace_subcategories(id) on delete restrict,
  add column if not exists product_condition_id uuid references public.product_conditions(id) on delete restrict,
  add column if not exists listing_status text,
  add column if not exists submitted_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by text,
  add column if not exists moderation_notes text not null default '';

-- Backfill legacy catalog rows, then make new rows private drafts by default.
update public.products set listing_status = 'approved' where listing_status is null;
update public.products p
set category_id = c.id
from public.marketplace_categories c
where p.category_id is null
  and c.slug = trim(both '-' from lower(regexp_replace(trim(p.category), '[^a-zA-Z0-9]+', '-', 'g')));
update public.products p
set product_condition_id = c.id
from public.product_conditions c
where p.product_condition_id is null and c.slug = 'brand-new';
alter table public.products alter column listing_status set default 'draft';
alter table public.products alter column listing_status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_listing_status_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products add constraint products_listing_status_check
      check (listing_status in ('draft', 'pending_approval', 'approved', 'rejected', 'changes_requested', 'archived'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_subcategory_matches_category_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products add constraint products_subcategory_matches_category_check
      check (subcategory_id is null or category_id is not null);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_subcategory_category_fkey'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products add constraint products_subcategory_category_fkey
      foreign key (subcategory_id, category_id)
      references public.marketplace_subcategories(id, category_id) on delete restrict;
  end if;
end;
$$;

create index if not exists products_seller_status_idx
  on public.products(seller_profile_id, listing_status, created_at desc);
create index if not exists products_marketplace_category_idx
  on public.products(category_id, subcategory_id, product_condition_id)
  where listing_status = 'approved' and is_active;

-- Match the existing deployment model: server routes enforce identity,
-- ownership, and business permissions before using service-role access.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'seller_profiles', 'seller_applications', 'seller_verifications',
    'subscription_plans', 'subscription_plan_features', 'subscriptions',
    'payment_settings', 'subscription_payments', 'marketplace_settings',
    'marketplace_categories', 'marketplace_subcategories', 'product_conditions',
    'product_attributes', 'product_attribute_options', 'product_attribute_values',
    'marketplace_reports'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from public, anon, authenticated', table_name);
    execute format('grant all on public.%I to service_role', table_name);
  end loop;
end;
$$;

revoke all on public.products from public, anon, authenticated;
grant all on public.products to service_role;
