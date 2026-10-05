alter table public.group_buys
  add column if not exists status text not null default 'open'
    check (status in ('open', 'closed'));

alter table public.group_buy_participants
  add column if not exists product_id text,
  add column if not exists product_title text,
  add column if not exists retail_price numeric(12, 2),
  add column if not exists wholesale_price numeric(12, 2);

update public.group_buy_participants p
set product_id = g.product_id,
    product_title = g.product_title,
    retail_price = g.retail_price,
    wholesale_price = g.wholesale_price
from public.group_buys g
where p.group_id = g.id and p.product_id is null;

create or replace function public.join_group_buy_with_product(
  target_group_id uuid,
  joining_token uuid,
  joining_product_id text,
  joining_product_title text,
  joining_retail_price numeric,
  joining_wholesale_price numeric
)
returns public.group_buys
language plpgsql
security definer
set search_path = public
as $$
declare
  current_group public.group_buys;
  inserted_participant integer;
begin
  select * into current_group from public.group_buys where id = target_group_id for update;
  if not found then raise exception 'group buy not found'; end if;
  if current_group.status <> 'open' then raise exception 'group buy is closed'; end if;
  if current_group.expires_at <= now() then raise exception 'group buy expired'; end if;

  insert into public.group_buy_participants
    (group_id, participant_token, product_id, product_title, retail_price, wholesale_price)
  values
    (target_group_id, joining_token, joining_product_id, joining_product_title, joining_retail_price, joining_wholesale_price)
  on conflict (group_id, participant_token) do nothing;
  get diagnostics inserted_participant = row_count;

  if inserted_participant > 0 then
    update public.group_buys set participant_count = participant_count + 1
    where id = target_group_id returning * into current_group;
  end if;
  return current_group;
end;
$$;

create or replace function public.close_group_buy(target_group_id uuid, closing_token uuid)
returns public.group_buys
language plpgsql
security definer
set search_path = public
as $$
declare
  current_group public.group_buys;
begin
  select * into current_group from public.group_buys where id = target_group_id for update;
  if not found then raise exception 'group buy not found'; end if;
  if not exists (
    select 1 from public.group_buy_participants
    where group_id = target_group_id and participant_token = closing_token
  ) then raise exception 'participant required'; end if;
  if current_group.participant_count < current_group.minimum_quantity then raise exception 'minimum participants not reached'; end if;
  if current_group.status <> 'open' then raise exception 'group buy already closed'; end if;
  update public.group_buys set status = 'closed' where id = target_group_id returning * into current_group;
  return current_group;
end;
$$;

revoke all on function public.join_group_buy_with_product(uuid, uuid, text, text, numeric, numeric) from public, anon, authenticated;
revoke all on function public.close_group_buy(uuid, uuid) from public, anon, authenticated;
grant execute on function public.join_group_buy_with_product(uuid, uuid, text, text, numeric, numeric) to service_role;
grant execute on function public.close_group_buy(uuid, uuid) to service_role;
