-- Phase 7 public marketplace trust labels. Existing first-party listings are
-- explicitly designated, while seller listings remain seller-owned.
alter table public.products
  add column if not exists is_official_unisoko boolean not null default false;

update public.products
set is_official_unisoko = true
where seller_profile_id is null and is_official_unisoko = false;
