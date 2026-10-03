alter table public.trade_in_requests
  drop constraint if exists trade_in_requests_expected_price_check;

alter table public.trade_in_requests
  add constraint trade_in_requests_expected_price_nonnegative_check check (expected_price >= 0),
  add column if not exists device_brand text,
  add column if not exists device_model text,
  add column if not exists ram text,
  add column if not exists storage text,
  add column if not exists cosmetic_condition text,
  add column if not exists screen_condition text,
  add column if not exists battery_health text,
  add column if not exists accessories text[] not null default '{}',
  add column if not exists valuation_inputs jsonb,
  add column if not exists quote_token_hash text unique,
  add column if not exists expires_at timestamptz;

alter table public.orders
  add column if not exists trade_in_request_id text unique references public.trade_in_requests(id) on delete set null,
  add column if not exists trade_in_estimate numeric(12, 2) not null default 0 check (trade_in_estimate >= 0),
  add column if not exists trade_in_inspection_status text not null default 'Not Required'
    check (trade_in_inspection_status in ('Not Required', 'Trade-In Pending Inspection', 'Inspected', 'Rejected'));

create index if not exists trade_in_quote_expiry_idx
  on public.trade_in_requests (expires_at)
  where quote_token_hash is not null;

comment on column public.orders.trade_in_estimate is
  'Server-calculated provisional discount; physical inspection is required before dispatch.';

comment on column public.orders.trade_in_inspection_status is
  'Orders using an in-cart trade-in remain pending physical inspection before dispatch.';

create or replace function public.prevent_uninspected_trade_in_dispatch()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.trade_in_request_id is not null
     and new.trade_in_inspection_status <> 'Inspected'
     and (new.fulfillment_status = 'Ready for Dispatch'
       or (new.delivery_status is distinct from old.delivery_status and new.delivery_status <> 'Not Dispatched')) then
    raise exception 'trade-in inspection required before dispatch';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_require_trade_in_inspection on public.orders;
create trigger orders_require_trade_in_inspection
before update on public.orders
for each row execute function public.prevent_uninspected_trade_in_dispatch();
