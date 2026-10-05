-- Phase 5: moderation decision metadata for submitted seller listings.
alter table public.products
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by text;

create index if not exists products_pending_moderation_idx
  on public.products(submitted_at asc)
  where seller_profile_id is not null and listing_status = 'pending_approval';

-- Seller-owned listings must remain inactive unless moderation approved them.
do $$
begin
  if not exists (select 1 from pg_constraint where conname='seller_products_require_approval' and conrelid='public.products'::regclass) then
    alter table public.products add constraint seller_products_require_approval
      check (seller_profile_id is null or listing_status = 'approved' or not is_active);
  end if;
end;
$$;
