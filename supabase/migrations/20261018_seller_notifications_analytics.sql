create table if not exists public.seller_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seller_profile_id uuid not null references public.seller_profiles(id) on delete cascade,
  kind text not null check (kind in ('product_approved','product_rejected','product_changes_requested')),
  title text not null check (char_length(title) between 2 and 160),
  message text not null default '' check (char_length(message) <= 1000),
  resource_id text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists seller_notifications_user_created_idx
  on public.seller_notifications(user_id, created_at desc);
alter table public.seller_notifications enable row level security;

create or replace function public.notify_seller_product_review()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_user_id uuid; v_kind text;
begin
  if new.seller_profile_id is null or new.listing_status not in ('approved','rejected','changes_requested') then return new; end if;
  if tg_op = 'UPDATE' and new.listing_status is not distinct from old.listing_status then return new; end if;
  select user_id into v_user_id from public.seller_profiles where id = new.seller_profile_id;
  if v_user_id is null then return new; end if;
  v_kind := case new.listing_status when 'approved' then 'product_approved' when 'rejected' then 'product_rejected' else 'product_changes_requested' end;
  insert into public.seller_notifications(user_id,seller_profile_id,kind,title,message,resource_id)
  values(v_user_id,new.seller_profile_id,v_kind,
    case v_kind when 'product_approved' then 'Product approved' when 'product_rejected' then 'Product not approved' else 'Product needs changes' end,
    case when new.listing_status = 'approved' then coalesce(new.name,'Your product') || ' is now published.' else coalesce(new.moderation_notes,'Review your listing and update it before resubmitting.') end,
    new.id);
  return new;
end $$;

drop trigger if exists seller_product_review_notification on public.products;
create trigger seller_product_review_notification
after insert or update of listing_status on public.products
for each row execute function public.notify_seller_product_review();
