alter table public.orders
  add column if not exists cancellation_status text not null default 'Not Requested'
    check (cancellation_status in ('Not Requested', 'Pending', 'Under Review', 'Approved', 'Rejected', 'Completed'));

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('Pending Verification', 'Approved', 'Out for Delivery', 'Completed', 'Cancelled'));

alter table public.order_status_history drop constraint if exists order_status_history_status_type_check;
alter table public.order_status_history add constraint order_status_history_status_type_check
  check (status_type in ('payment', 'fulfillment', 'delivery', 'cancellation'));

create table if not exists public.order_cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique references public.orders(id) on delete cascade,
  reason text not null check (reason in ('Changed mind', 'Ordered by mistake', 'Found another product', 'Delivery taking too long', 'Other')),
  details text not null default '' check (char_length(details) <= 1000),
  status text not null default 'Pending' check (status in ('Pending', 'Under Review', 'Approved', 'Rejected', 'Completed')),
  refund_amount numeric(12, 2) not null default 0 check (refund_amount >= 0),
  refund_reference text not null default '' check (char_length(refund_reference) <= 100),
  admin_notes text not null default '' check (char_length(admin_notes) <= 2000),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  resolved_at timestamptz
);

create index if not exists order_cancellation_status_requested_idx
  on public.order_cancellation_requests (status, requested_at desc);

alter table public.order_cancellation_requests enable row level security;
revoke all on public.order_cancellation_requests from anon, authenticated;
grant all on public.order_cancellation_requests to service_role;

create or replace function public.request_order_cancellation(
  target_order_id text,
  supplied_token_hash text,
  cancellation_reason text,
  cancellation_details text
)
returns public.order_cancellation_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  current_order public.orders;
  cancellation public.order_cancellation_requests;
begin
  select * into current_order from public.orders
  where id = target_order_id and tracking_token_hash = supplied_token_hash
  for update;
  if not found then raise exception 'invalid order access'; end if;
  if current_order.status in ('Completed', 'Cancelled') or current_order.delivery_status <> 'Not Dispatched'
     or current_order.fulfillment_status = 'Ready for Dispatch' then
    raise exception 'order is no longer eligible for cancellation';
  end if;
  if cancellation_reason not in ('Changed mind', 'Ordered by mistake', 'Found another product', 'Delivery taking too long', 'Other') then
    raise exception 'invalid cancellation reason';
  end if;

  insert into public.order_cancellation_requests (order_id, reason, details)
  values (target_order_id, cancellation_reason, left(cancellation_details, 1000))
  returning * into cancellation;

  update public.orders set cancellation_status = 'Pending', updated_at = now()
  where id = target_order_id;

  insert into public.order_status_history (order_id, status_type, status, label, changed_by)
  values (target_order_id, 'cancellation', 'Pending', 'Cancellation Requested', 'customer');
  return cancellation;
end;
$$;

revoke all on function public.request_order_cancellation(text, text, text, text) from public, anon, authenticated;
grant execute on function public.request_order_cancellation(text, text, text, text) to service_role;

create or replace function public.review_order_cancellation(
  target_request_id uuid,
  next_status text,
  processed_refund_amount numeric,
  processed_refund_reference text,
  review_notes text
)
returns public.order_cancellation_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  cancellation public.order_cancellation_requests;
  related_order public.orders;
  valid_transition boolean;
begin
  select * into cancellation from public.order_cancellation_requests
  where id = target_request_id for update;
  if not found then raise exception 'cancellation request not found'; end if;
  select * into related_order from public.orders where id = cancellation.order_id for update;

  valid_transition :=
    (cancellation.status = 'Pending' and next_status in ('Under Review', 'Rejected')) or
    (cancellation.status = 'Under Review' and next_status in ('Approved', 'Rejected')) or
    (cancellation.status = 'Approved' and next_status in ('Completed', 'Rejected'));
  if not valid_transition then raise exception 'invalid cancellation transition'; end if;

  if next_status = 'Completed' then
    if related_order.payment_status = 'Verified' then
      if processed_refund_amount <> related_order.total_amount or length(trim(processed_refund_reference)) < 6 then
        raise exception 'verified payments require a full refund amount and provider reference';
      end if;
    elsif processed_refund_amount <> 0 then
      raise exception 'unverified payments cannot receive a refund';
    end if;
  elsif processed_refund_amount <> 0 or coalesce(processed_refund_reference, '') <> '' then
    raise exception 'refund details may only be recorded when completing a cancellation';
  end if;

  update public.order_cancellation_requests
  set status = next_status,
      refund_amount = case when next_status = 'Completed' then processed_refund_amount else 0 end,
      refund_reference = case when next_status = 'Completed' then left(trim(coalesce(processed_refund_reference, '')), 100) else '' end,
      admin_notes = left(coalesce(review_notes, ''), 2000),
      reviewed_at = now(),
      resolved_at = case when next_status in ('Completed', 'Rejected') then now() else null end
  where id = target_request_id returning * into cancellation;

  update public.orders
  set cancellation_status = next_status,
      status = case when next_status = 'Completed' then 'Cancelled' else status end,
      updated_at = now()
  where id = cancellation.order_id;

  insert into public.order_status_history (order_id, status_type, status, label, changed_by)
  values (cancellation.order_id, 'cancellation', next_status, 'Cancellation ' || next_status, 'admin');
  return cancellation;
end;
$$;

revoke all on function public.review_order_cancellation(uuid, text, numeric, text, text) from public, anon, authenticated;
grant execute on function public.review_order_cancellation(uuid, text, numeric, text, text) to service_role;

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
  if current_order.cancellation_status not in ('Not Requested', 'Rejected') or current_order.status = 'Cancelled' then
    raise exception 'cancellation review blocks order status changes';
  end if;

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
