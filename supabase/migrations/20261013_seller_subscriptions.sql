-- Phase 3: seller trials, paid plan requests, payment review, and entitlements.

insert into public.subscription_plans
  (name, slug, description, plan_type, price, currency, billing_interval, duration_days, product_limit, limits, verification_level, is_popular, display_order)
values
  ('Free Trial', 'seller-trial', 'Full seller access during the configured trial period.', 'trial', 0, 'TZS', 'one_time', 30, null, '{}', 'standard', false, 0),
  ('Starter', 'seller-starter', 'Essential tools for a growing seller.', 'paid', 5000, 'TZS', 'month', 30, 20, '{"analytics":false,"priority_visibility":false}', 'none', false, 1),
  ('Popular', 'seller-popular', 'More room to grow with seller insights.', 'paid', 8500, 'TZS', 'month', 30, 100, '{"analytics":true,"priority_visibility":false}', 'standard', true, 2),
  ('Business', 'seller-business', 'Advanced visibility and tools for established sellers.', 'paid', 15000, 'TZS', 'month', 30, null, '{"analytics":true,"priority_visibility":true}', 'enhanced', false, 3)
on conflict (slug) do nothing;

insert into public.payment_settings (name, instructions, public_details, is_active, display_order)
select 'LIPA', 'Replace these instructions and public payment details with UniSoko’s approved LIPA payment information before enabling seller payments.', '{"LIPA number":"Configure before use"}'::jsonb, false, 0
where not exists (select 1 from public.payment_settings where name = 'LIPA');

insert into public.subscription_plan_features (plan_id, feature_key, label, description, is_enabled, feature_value, display_order)
select p.id, f.feature_key, f.label, f.description,
  (p.plan_type = 'trial' or f.feature_key in ('product_listings', 'seller_profile') or coalesce((p.limits->>f.feature_key)::boolean,false)),
  'true'::jsonb, f.display_order
from public.subscription_plans p
cross join (values
  ('product_listings','Product listings','Create and manage product listings.',1),
  ('seller_profile','Seller profile','Maintain your seller profile.',2),
  ('analytics','Sales analytics','View seller performance analytics.',3),
  ('priority_visibility','Priority visibility','Receive enhanced marketplace visibility.',4),
  ('verified_badge','Verified badge','Show an enhanced seller verification badge.',5)
) as f(feature_key,label,description,display_order)
where p.slug in ('seller-trial','seller-starter','seller-popular','seller-business')
on conflict (plan_id, feature_key) do nothing;

-- A paid request can coexist with an unexpired trial or paid entitlement.
drop index if exists public.subscriptions_one_current_per_seller_idx;
create unique index if not exists subscriptions_one_entitlement_per_seller_idx
  on public.subscriptions(seller_profile_id) where status in ('free_trial','active');
create unique index if not exists subscriptions_one_pending_per_seller_idx
  on public.subscriptions(seller_profile_id) where status = 'pending';

-- Existing Phase 2 approved sellers receive a single trial when Phase 3 is installed.
insert into public.subscriptions (seller_profile_id, plan_id, status, plan_snapshot, amount, currency, starts_at, expires_at)
select sp.id, p.id, 'free_trial',
  jsonb_build_object('name',p.name,'slug',p.slug,'description',p.description,'price',0,'currency','TZS','duration_days',coalesce((select (setting_value #>> '{}')::integer from public.marketplace_settings where setting_key='seller_trial_duration_days'),30),'product_limit',p.product_limit,'limits',p.limits,'verification_level',p.verification_level,'features',coalesce((select jsonb_agg(jsonb_build_object('key',f.feature_key,'label',f.label,'description',f.description,'enabled',f.is_enabled,'value',f.feature_value) order by f.display_order) from public.subscription_plan_features f where f.plan_id=p.id),'[]'::jsonb)),
  0,'TZS',now(),now()+make_interval(days=>coalesce((select (setting_value #>> '{}')::integer from public.marketplace_settings where setting_key='seller_trial_duration_days'),30))
from public.seller_profiles sp cross join public.subscription_plans p
where sp.status='approved' and p.slug='seller-trial'
and not exists (select 1 from public.subscriptions s where s.seller_profile_id=sp.id and s.status in ('free_trial','active','pending'));

create or replace function public.review_seller_application(
  p_application_id uuid, p_decision text, p_review_notes text, p_reviewed_by text
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_profile_id uuid; v_application_status text; v_plan public.subscription_plans%rowtype; v_days integer;
begin
  if p_decision not in ('approved','rejected') or char_length(coalesce(p_review_notes,''))>2000 then
    raise exception 'Invalid seller application decision.' using errcode='22023';
  end if;
  select seller_profile_id,status into v_profile_id,v_application_status from public.seller_applications where id=p_application_id for update;
  if v_profile_id is null or v_application_status<>'pending' then raise exception 'Seller application is no longer pending.' using errcode='P0002'; end if;
  update public.seller_applications set status=p_decision,review_notes=trim(coalesce(p_review_notes,'')),reviewed_at=now(),reviewed_by=left(coalesce(p_reviewed_by,'admin'),160),updated_at=now() where id=p_application_id;
  update public.seller_profiles set status=p_decision,updated_at=now() where id=v_profile_id;
  if p_decision='approved' then
    insert into public.seller_verifications(seller_profile_id) values(v_profile_id) on conflict(seller_profile_id) do nothing;
    if not exists(select 1 from public.subscriptions where seller_profile_id=v_profile_id) then
      select * into v_plan from public.subscription_plans where slug='seller-trial' and is_active for share;
      if found then
        select coalesce((setting_value #>> '{}')::integer,30) into v_days from public.marketplace_settings where setting_key='seller_trial_duration_days';
        v_days:=greatest(1,coalesce(v_days,30));
        insert into public.subscriptions(seller_profile_id,plan_id,status,plan_snapshot,amount,currency,starts_at,expires_at)
        values(v_profile_id,v_plan.id,'free_trial',jsonb_build_object('name',v_plan.name,'slug',v_plan.slug,'description',v_plan.description,'price',0,'currency',v_plan.currency,'duration_days',v_days,'product_limit',v_plan.product_limit,'limits',v_plan.limits,'verification_level',v_plan.verification_level,'features',(select coalesce(jsonb_agg(jsonb_build_object('key',f.feature_key,'label',f.label,'description',f.description,'enabled',f.is_enabled,'value',f.feature_value) order by f.display_order),'[]'::jsonb) from public.subscription_plan_features f where f.plan_id=v_plan.id)),0,v_plan.currency,now(),now()+make_interval(days=>v_days));
      end if;
    end if;
  end if;
  return jsonb_build_object('application_id',p_application_id,'seller_profile_id',v_profile_id,'status',p_decision);
end; $$;

create or replace function public.create_seller_plan_payment(p_user_id uuid,p_plan_id uuid,p_payment_setting_id uuid,p_reference text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_seller public.seller_profiles%rowtype; v_plan public.subscription_plans%rowtype; v_method public.payment_settings%rowtype; v_subscription_id uuid; v_payment_id uuid;
begin
  if char_length(trim(coalesce(p_reference,''))) not between 3 and 200 then raise exception 'Enter a valid transaction reference.' using errcode='22023'; end if;
  select * into v_seller from public.seller_profiles where user_id=p_user_id and status='approved' for update;
  if not found then raise exception 'Approved seller account required.' using errcode='42501'; end if;
  if exists(select 1 from public.subscriptions where seller_profile_id=v_seller.id and status='pending') then raise exception 'A payment is already awaiting review.' using errcode='23505'; end if;
  select * into v_plan from public.subscription_plans where id=p_plan_id and is_active and plan_type='paid';
  if not found then raise exception 'This plan is unavailable.' using errcode='22023'; end if;
  select * into v_method from public.payment_settings where id=p_payment_setting_id and is_active;
  if not found then raise exception 'This payment method is unavailable.' using errcode='22023'; end if;
  insert into public.subscriptions(seller_profile_id,plan_id,status,plan_snapshot,amount,currency)
  values(v_seller.id,v_plan.id,'pending',jsonb_build_object('name',v_plan.name,'slug',v_plan.slug,'description',v_plan.description,'price',v_plan.price,'currency',v_plan.currency,'duration_days',v_plan.duration_days,'product_limit',v_plan.product_limit,'limits',v_plan.limits,'verification_level',v_plan.verification_level,'features',(select coalesce(jsonb_agg(jsonb_build_object('key',f.feature_key,'label',f.label,'description',f.description,'enabled',f.is_enabled,'value',f.feature_value) order by f.display_order),'[]'::jsonb) from public.subscription_plan_features f where f.plan_id=v_plan.id)),v_plan.price,v_plan.currency) returning id into v_subscription_id;
  insert into public.subscription_payments(subscription_id,payment_setting_id,amount,currency,payment_method_snapshot,transaction_reference)
  values(v_subscription_id,v_method.id,v_plan.price,v_plan.currency,jsonb_build_object('name',v_method.name,'instructions',v_method.instructions,'public_details',v_method.public_details),trim(p_reference)) returning id into v_payment_id;
  return jsonb_build_object('subscription_id',v_subscription_id,'payment_id',v_payment_id,'status','pending');
end; $$;

create or replace function public.review_seller_plan_payment(p_payment_id uuid,p_decision text,p_reason text,p_reviewed_by text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_payment public.subscription_payments%rowtype; v_subscription public.subscriptions%rowtype; v_days integer;
begin
  if p_decision not in ('approved','rejected') or char_length(coalesce(p_reason,''))>2000 then raise exception 'Invalid payment decision.' using errcode='22023'; end if;
  select * into v_payment from public.subscription_payments where id=p_payment_id for update;
  if not found or v_payment.status<>'pending' then raise exception 'Payment is no longer pending.' using errcode='P0002'; end if;
  select * into v_subscription from public.subscriptions where id=v_payment.subscription_id for update;
  if p_decision='approved' then
    update public.subscriptions set status='expired',updated_at=now() where seller_profile_id=v_subscription.seller_profile_id and id<>v_subscription.id and status in ('free_trial','active');
    v_days:=greatest(1,coalesce((v_subscription.plan_snapshot->>'duration_days')::integer,30));
    update public.subscriptions set status='active',starts_at=now(),expires_at=now()+make_interval(days=>v_days),approved_at=now(),approved_by=left(coalesce(p_reviewed_by,'admin'),160),updated_at=now() where id=v_subscription.id;
  else
    update public.subscriptions set status='rejected',rejection_reason=nullif(trim(p_reason),''),updated_at=now() where id=v_subscription.id;
  end if;
  update public.subscription_payments set status=p_decision,reviewed_at=now(),reviewed_by=left(coalesce(p_reviewed_by,'admin'),160),rejection_reason=case when p_decision='rejected' then nullif(trim(p_reason),'') else null end,updated_at=now() where id=p_payment_id;
  return jsonb_build_object('payment_id',p_payment_id,'subscription_id',v_subscription.id,'status',p_decision);
end; $$;

revoke all on function public.create_seller_plan_payment(uuid,uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.review_seller_plan_payment(uuid,text,text,text) from public,anon,authenticated;
revoke all on function public.review_seller_application(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.create_seller_plan_payment(uuid,uuid,uuid,text) to service_role;
grant execute on function public.review_seller_plan_payment(uuid,text,text,text) to service_role;
grant execute on function public.review_seller_application(uuid,text,text,text) to service_role;
