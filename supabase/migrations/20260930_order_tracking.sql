create table if not exists public.orders (
  id text primary key,
  tracking_token_hash text not null unique check (tracking_token_hash ~ '^[a-f0-9]{64}$'),
  product_id text not null,
  product_title text not null,
  buyer_name text not null,
  buyer_phone text not null,
  university text not null,
  delivery_spot_type text not null check (delivery_spot_type in ('Hostel', 'Landmark', 'Off-Campus', 'Courier')),
  delivery_details text not null,
  quantity integer not null check (quantity > 0),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  winga_code_used text,
  lipa_namba_tx_id text not null,
  item_serial_number text,
  warranty_days smallint check (warranty_days in (30, 60, 90)),
  status text not null default 'Pending Verification' check (status in ('Pending Verification', 'Approved', 'Out for Delivery', 'Completed')),
  payment_status text not null default 'Submitted' check (payment_status in ('Submitted', 'Verification', 'Verified', 'Failed')),
  fulfillment_status text not null default 'Unconfirmed' check (fulfillment_status in ('Unconfirmed', 'Confirmed', 'Preparing', 'Ready for Dispatch')),
  delivery_status text not null default 'Not Dispatched' check (delivery_status in ('Not Dispatched', 'With Winga', 'With Courier', 'Ready for Pickup', 'Delivered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (payment_status, fulfillment_status, delivery_status);

create table if not exists public.order_status_history (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id) on delete cascade,
  status_type text not null check (status_type in ('payment', 'fulfillment', 'delivery')),
  status text not null,
  label text not null,
  changed_by text not null check (changed_by in ('customer', 'admin')),
  changed_at timestamptz not null default now()
);

create index if not exists order_status_history_order_idx on public.order_status_history (order_id, changed_at);

alter table public.orders enable row level security;
alter table public.order_status_history enable row level security;
revoke all on public.orders, public.order_status_history from anon, authenticated;
grant all on public.orders, public.order_status_history to service_role;

create or replace function public.transition_order_status(
  target_order_id text,
  next_status_type text,
  next_status text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  current_order public.orders;
  updated_order public.orders;
  event_label text;
begin
  select * into current_order from public.orders where id = target_order_id for update;
  if not found then raise exception 'order not found'; end if;

  if next_status_type = 'payment' then
    if not (
      (current_order.payment_status = 'Submitted' and next_status = 'Verification') or
      (current_order.payment_status = 'Verification' and next_status in ('Verified', 'Failed'))
    ) then raise exception 'invalid payment status transition'; end if;

    update public.orders
    set payment_status = next_status,
        status = case when next_status = 'Verified' then 'Approved' else status end,
        approved_at = case when next_status = 'Verified' then now() else approved_at end,
        updated_at = now()
    where id = target_order_id returning * into updated_order;

    event_label := case next_status
      when 'Verification' then 'Payment Verification'
      when 'Verified' then 'Payment Verified'
      else 'Payment Failed'
    end;
    insert into public.order_status_history (order_id, status_type, status, label, changed_by)
    values (target_order_id, 'payment', next_status, event_label, 'admin');

    if next_status = 'Verified' then
      update public.orders
      set fulfillment_status = 'Confirmed', updated_at = now()
      where id = target_order_id returning * into updated_order;
      insert into public.order_status_history (order_id, status_type, status, label, changed_by)
      values (target_order_id, 'fulfillment', 'Confirmed', 'Order Confirmed', 'admin');
    end if;
  elsif next_status_type = 'fulfillment' then
    if current_order.payment_status <> 'Verified' or not (
      (current_order.fulfillment_status = 'Confirmed' and next_status = 'Preparing') or
      (current_order.fulfillment_status = 'Preparing' and next_status = 'Ready for Dispatch')
    ) then raise exception 'invalid fulfillment status transition'; end if;

    update public.orders
    set fulfillment_status = next_status, updated_at = now()
    where id = target_order_id returning * into updated_order;
    event_label := case next_status when 'Preparing' then 'Preparing Order' else 'Ready for Dispatch' end;
    insert into public.order_status_history (order_id, status_type, status, label, changed_by)
    values (target_order_id, 'fulfillment', next_status, event_label, 'admin');
  elsif next_status_type = 'delivery' then
    if current_order.fulfillment_status <> 'Ready for Dispatch' or not (
      (current_order.delivery_status = 'Not Dispatched' and next_status in ('With Winga', 'With Courier')) or
      (current_order.delivery_status in ('With Winga', 'With Courier') and next_status = 'Ready for Pickup') or
      (current_order.delivery_status = 'Ready for Pickup' and next_status = 'Delivered')
    ) then raise exception 'invalid delivery status transition'; end if;

    if next_status = 'With Courier' and current_order.delivery_spot_type <> 'Courier' then
      raise exception 'courier status requires courier delivery';
    end if;
    if next_status = 'With Winga' and current_order.delivery_spot_type = 'Courier' then
      raise exception 'winga status requires campus delivery';
    end if;

    update public.orders
    set delivery_status = next_status,
        status = case
          when next_status = 'Delivered' then 'Completed'
          when next_status in ('With Winga', 'With Courier', 'Ready for Pickup') then 'Out for Delivery'
          else status
        end,
        updated_at = now()
    where id = target_order_id returning * into updated_order;
    event_label := case next_status
      when 'With Winga' then 'With Winga'
      when 'With Courier' then 'With Courier'
      when 'Ready for Pickup' then 'Ready for Pickup'
      else 'Delivered'
    end;
    insert into public.order_status_history (order_id, status_type, status, label, changed_by)
    values (target_order_id, 'delivery', next_status, event_label, 'admin');
  else
    raise exception 'invalid order status type';
  end if;

  return updated_order;
end;
$$;

revoke all on function public.transition_order_status(text, text, text) from public, anon, authenticated;
grant execute on function public.transition_order_status(text, text, text) to service_role;