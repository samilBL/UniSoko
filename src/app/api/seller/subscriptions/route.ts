import { NextRequest, NextResponse } from 'next/server';
import { getSellerActor, getSellerProfile } from '@/lib/sellerAuth';
import { getSellerEntitlement } from '@/lib/sellerEntitlements';

export const dynamic = 'force-dynamic';

export async function GET() {
  const actor = await getSellerActor();
  if (actor.kind !== 'ok') return NextResponse.json({ error: actor.kind === 'unavailable' ? 'Seller accounts are not configured.' : 'Sign in with your verified UniSoko account.' }, { status: actor.kind === 'unavailable' ? 503 : 401 });
  const { data: profile } = await getSellerProfile(actor.serviceClient, actor.user.id);
  if (!profile) return NextResponse.json({ plans: [], paymentMethods: [], subscription: null, payment: null });
  const [{ data: plans, error: planError }, { data: methods, error: methodError }, current, { data: pending }] = await Promise.all([
    actor.serviceClient.from('subscription_plans').select('id,name,slug,description,plan_type,price,currency,billing_interval,duration_days,product_limit,limits,verification_level,is_popular,display_order,subscription_plan_features(feature_key,label,description,is_enabled)').eq('is_active', true).order('display_order'),
    actor.serviceClient.from('payment_settings').select('id,name,instructions,public_details,display_order').eq('is_active', true).order('display_order'),
    getSellerEntitlement(actor.serviceClient, profile.id),
    actor.serviceClient.from('subscriptions').select('id,status,plan_snapshot,expires_at,created_at,subscription_payments(id,status,transaction_reference,rejection_reason,payment_method_snapshot)').eq('seller_profile_id', profile.id).eq('status', 'pending').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (planError || methodError || current.error) return NextResponse.json({ error: 'Subscription settings are not ready. Confirm the Phase 3 migration has been applied.' }, { status: 503 });
  return NextResponse.json({ plans: plans || [], paymentMethods: methods || [], subscription: current.entitlement, payment: pending || null }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const actor = await getSellerActor();
  if (actor.kind !== 'ok') return NextResponse.json({ error: actor.kind === 'unavailable' ? 'Seller accounts are not configured.' : 'Sign in with your verified UniSoko account.' }, { status: actor.kind === 'unavailable' ? 503 : 401 });
  let body: { planId?: unknown; paymentMethodId?: unknown; transactionReference?: unknown };
  try { body = await request.json() as typeof body; } catch { return NextResponse.json({ error: 'Enter a valid payment reference.' }, { status: 400 }); }
  const planId = typeof body.planId === 'string' ? body.planId : '';
  const paymentMethodId = typeof body.paymentMethodId === 'string' ? body.paymentMethodId : '';
  const transactionReference = typeof body.transactionReference === 'string' ? body.transactionReference.trim() : '';
  if (!planId || !paymentMethodId || transactionReference.length < 3 || transactionReference.length > 200) return NextResponse.json({ error: 'Choose a plan and payment method, then enter a valid transaction reference.' }, { status: 400 });
  const { data, error } = await actor.serviceClient.rpc('create_seller_plan_payment', { p_user_id: actor.user.id, p_plan_id: planId, p_payment_setting_id: paymentMethodId, p_reference: transactionReference });
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A payment is already awaiting review, or this transaction reference was already submitted.' }, { status: 409 });
    if (error.code === '42501') return NextResponse.json({ error: 'Your seller application must be approved before you can request a paid plan.' }, { status: 403 });
    if (error.code === '22023') return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('Seller plan payment submission failed', { code: error.code });
    return NextResponse.json({ error: 'Could not submit this payment for review.' }, { status: 500 });
  }
  return NextResponse.json({ result: data }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
