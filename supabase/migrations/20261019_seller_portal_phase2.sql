alter table public.products
  add column if not exists seller_wholesale_enabled boolean not null default false,
  add column if not exists seller_wholesale_discount_percent numeric(5,2) not null default 5
    check (seller_wholesale_discount_percent between 0 and 5),
  add column if not exists seller_wholesale_minimum integer not null default 3
    check (seller_wholesale_minimum between 2 and 12);

alter table public.orders
  add column if not exists dispatch_assignee_type text
    check (dispatch_assignee_type is null or dispatch_assignee_type in ('winga', 'dispatch_team', 'courier')),
  add column if not exists dispatch_assignee_id text,
  add column if not exists dispatch_assignee_name text,
  add column if not exists dispatch_assigned_at timestamptz;

create index if not exists products_seller_wholesale_enabled_idx
  on public.products (seller_profile_id, seller_wholesale_enabled)
  where seller_profile_id is not null;

create or replace function public.assign_default_order_dispatch()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.fulfillment_status = 'Ready for Dispatch'
    and old.fulfillment_status is distinct from new.fulfillment_status
    and new.dispatch_assignee_type is null then
    if new.delivery_spot_type = 'Courier' then
      new.dispatch_assignee_type := 'courier';
      new.dispatch_assignee_id := 'regional_courier';
      new.dispatch_assignee_name := 'Regional Courier Team';
    else
      new.dispatch_assignee_type := 'dispatch_team';
      new.dispatch_assignee_id := 'campus_dispatch';
      new.dispatch_assignee_name := 'UniSoko Campus Dispatch';
    end if;
    new.dispatch_assigned_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists orders_assign_default_dispatch on public.orders;
create trigger orders_assign_default_dispatch
before update of fulfillment_status on public.orders
for each row execute function public.assign_default_order_dispatch();

alter table public.order_status_history
  drop constraint if exists order_status_history_changed_by_check;
alter table public.order_status_history
  add constraint order_status_history_changed_by_check
  check (changed_by in ('customer', 'admin', 'winga'));

create or replace function public.transition_assigned_winga_delivery(
  target_order_id text,
  assigned_winga_id uuid,
  next_delivery_status text
)
returns public.orders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_order public.orders;
  updated_order public.orders;
  event_label text;
begin
  select * into current_order from public.orders where id = target_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if current_order.dispatch_assignee_type <> 'winga' or current_order.dispatch_assignee_id <> assigned_winga_id::text then
    raise exception 'order is not assigned to this Winga';
  end if;
  if current_order.payment_status <> 'Verified' or current_order.fulfillment_status <> 'Ready for Dispatch' then
    raise exception 'order is not ready for Winga delivery';
  end if;
  if not (
    (current_order.delivery_status = 'With Winga' and next_delivery_status = 'Ready for Pickup') or
    (current_order.delivery_status = 'Ready for Pickup' and next_delivery_status = 'Delivered')
  ) then raise exception 'invalid Winga delivery transition'; end if;

  update public.orders
  set delivery_status = next_delivery_status,
      status = case when next_delivery_status = 'Delivered' then 'Completed' else 'Out for Delivery' end,
      updated_at = now()
  where id = target_order_id returning * into updated_order;

  event_label := case next_delivery_status
    when 'Ready for Pickup' then 'Ready for Pickup'
    else 'Delivered'
  end;
  insert into public.order_status_history (order_id, status_type, status, label, changed_by)
  values (target_order_id, 'delivery', next_delivery_status, event_label, 'winga');
  return updated_order;
end;
$$;

revoke all on function public.transition_assigned_winga_delivery(text, uuid, text) from public, anon, authenticated;
grant execute on function public.transition_assigned_winga_delivery(text, uuid, text) to service_role;
.