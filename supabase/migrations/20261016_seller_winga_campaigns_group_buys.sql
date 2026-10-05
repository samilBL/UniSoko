-- Seller Winga promotion terms, seller group-buy pricing, and durable Winga earnings.

alter table public.products
  add column if not exists seller_winga_campaign_enabled boolean not null default false,
  add column if not exists seller_winga_commission_rate numeric(5,4) not null default 0.05
    check (seller_winga_commission_rate >= 0 and seller_winga_commission_rate <= 0.30),
  add column if not exists seller_group_buy_enabled boolean not null default false,
  add column if not exists seller_wholesale_price numeric(12,2)
    check (seller_wholesale_price is null or seller_wholesale_price >= 0),
  add column if not exists seller_group_buy_minimum integer not null default 3
    check (seller_group_buy_minimum between 2 and 100);

alter table public.group_buys
  add column if not exists seller_profile_id uuid references public.seller_profiles(id) on delete restrict;

alter table public.order_items
  add column if not exists seller_profile_id uuid references public.seller_profiles(id) on delete restrict,
  add column if not exists winga_commission_rate numeric(5,4) not null default 0.05
    check (winga_commission_rate >= 0 and winga_commission_rate <= 0.30);

create table if not exists public.winga_commissions (
  id uuid primary key default gen_random_uuid(),
  winga_application_id uuid not null references public.winga_applications(id) on delete restrict,
  seller_profile_id uuid references public.seller_profiles(id) on delete restrict,
  order_id text not null references public.orders(id) on delete restrict,
  order_item_id bigint not null references public.order_items(id) on delete restrict,
  product_id text not null,
  product_title text not null,
  commission_rate numeric(5,4) not null check (commission_rate > 0 and commission_rate <= 0.30),
  commission_base numeric(12,2) not null check (commission_base >= 0),
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'payable', 'paid', 'void')),
  payout_reference text check (payout_reference is null or char_length(payout_reference) <= 160),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  unique (order_item_id)
);

create index if not exists winga_commissions_winga_status_idx
  on public.winga_commissions (winga_application_id, status, created_at desc);
create index if not exists winga_commissions_seller_status_idx
  on public.winga_commissions (seller_profile_id, status, created_at desc)
  where seller_profile_id is not null;

alter table public.winga_commissions enable row level security;
revoke all on public.winga_commissions from anon, authenticated;
grant all on public.winga_commissions to service_role;

create or replace function public.credit_winga_commissions_for_completed_order()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  referrer public.winga_applications;
begin
  if new.payment_status <> 'Verified' or new.delivery_status <> 'Delivered' then
    return new;
  end if;
  if old.payment_status = 'Verified' and old.delivery_status = 'Delivered' then
    return new;
  end if;

  select * into referrer from public.winga_applications
  where promo_code = new.winga_code_used and status = 'Approved';
  if not found then return new; end if;

  insert into public.winga_commissions (
    winga_application_id, seller_profile_id, order_id, order_item_id,
    product_id, product_title, commission_rate, commission_base, amount, status
  )
  select referrer.id, oi.seller_profile_id, new.id, oi.id,
    oi.product_id, oi.product_title, oi.winga_commission_rate,
    greatest(0, oi.line_total - case when new.subtotal_amount > 0 then new.promo_discount * oi.line_total / new.subtotal_amount else 0 end),
    round(greatest(0, oi.line_total - case when new.subtotal_amount > 0 then new.promo_discount * oi.line_total / new.subtotal_amount else 0 end) * oi.winga_commission_rate, 2), 'payable'
  from public.order_items oi
  where oi.order_id = new.id
    and oi.winga_commission_rate > 0
    and greatest(0, oi.line_total - case when new.subtotal_amount > 0 then new.promo_discount * oi.line_total / new.subtotal_amount else 0 end) > 0
  on conflict (order_item_id) do nothing;

  return new;
end;
$$;

drop trigger if exists orders_credit_winga_commissions on public.orders;
create trigger orders_credit_winga_commissions
after update of payment_status, delivery_status on public.orders
for each row execute function public.credit_winga_commissions_for_completed_order();

revoke all on function public.credit_winga_commissions_for_completed_order() from public, anon, authenticated;
