import { NextRequest, NextResponse } from 'next/server';
import { getSellerActor, getSellerProfile } from '@/lib/sellerAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const actor = await getSellerActor();
  if (actor.kind === 'unavailable') return NextResponse.json({ error: 'Seller marketplace is not configured.' }, { status: 503 });
  if (actor.kind !== 'ok') return NextResponse.json({ error: 'Sign in through the seller portal.' }, { status: 401 });
  const { data: seller } = await getSellerProfile(actor.serviceClient, actor.user.id);
  if (!seller) return NextResponse.json({ error: 'Seller account not found.' }, { status: 404 });
  const { data, error } = await actor.serviceClient.from('winga_commissions')
    .select('id,product_title,amount,status,created_at,paid_at').eq('seller_profile_id', seller.id)
    .order('created_at', { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: 'Seller commission accounting is unavailable. Apply the latest UniSoko migration.' }, { status: 503 });
  const totals = (data || []).reduce((summary, row) => { const amount = Number(row.amount); summary.total += amount; if (row.status === 'payable') summary.payable += amount; if (row.status === 'paid') summary.paid += amount; return summary; }, { total: 0, payable: 0, paid: 0 });
  return NextResponse.json({ commissions: data || [], totals }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const actor = await getSellerActor();
  if (actor.kind === 'unavailable') return NextResponse.json({ error: 'Seller marketplace is not configured.' }, { status: 503 });
  if (actor.kind !== 'ok') return NextResponse.json({ error: 'Sign in through the seller portal.' }, { status: 401 });
  const { data: seller, error: sellerError } = await getSellerProfile(actor.serviceClient, actor.user.id);
  if (sellerError) return NextResponse.json({ error: 'Could not load your seller account.' }, { status: 503 });
  if (!seller || seller.status !== 'approved') return NextResponse.json({ error: 'An approved seller account is required.' }, { status: 403 });
  let body: Record<string, unknown>;
  try { const value: unknown = await request.json(); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); body = value as Record<string, unknown>; }
  catch { return NextResponse.json({ error: 'Enter valid campaign settings.' }, { status: 400 }); }
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const wingaEnabled = body.wingaEnabled === true;
  const ratePercent = Number(body.wingaRatePercent);
  const wholesaleEnabled = body.wholesaleEnabled === true;
  const wholesaleDiscountPercent = Number(body.wholesaleDiscountPercent);
  const wholesaleMinimum = Number(body.wholesaleMinimum);
  const groupBuyEnabled = body.groupBuyEnabled === true;
  const minimum = Number(body.groupBuyMinimum);
  if (!id || typeof body.wingaEnabled !== 'boolean' || typeof body.wholesaleEnabled !== 'boolean' || typeof body.groupBuyEnabled !== 'boolean' ||
      (wingaEnabled && (!Number.isFinite(ratePercent) || ratePercent < 1 || ratePercent > 30)) ||
      !Number.isFinite(wholesaleDiscountPercent) || wholesaleDiscountPercent < 0 || wholesaleDiscountPercent > 5 ||
      !Number.isInteger(wholesaleMinimum) || wholesaleMinimum < 2 || wholesaleMinimum > 12 ||
      (groupBuyEnabled && (!Number.isInteger(minimum) || minimum < 2 || minimum > 100))) {
    return NextResponse.json({ error: 'Wholesale must stay within 0–5% and 2–12 units. Group buying needs 2–100 students, and Winga commission must be 1–30%.' }, { status: 400 });
  }
  const { data: current, error: lookupError } = await actor.serviceClient.from('products').select('id,price')
    .eq('id', id).eq('seller_profile_id', seller.id).eq('listing_status', 'approved').eq('is_active', true).maybeSingle();
  if (lookupError) return NextResponse.json({ error: 'Marketplace settings unavailable. Apply the latest UniSoko migration.' }, { status: 503 });
  if (!current) return NextResponse.json({ error: 'Only approved, active products can join these programs.' }, { status: 409 });
  const { data, error } = await actor.serviceClient.from('products').update({
    seller_winga_campaign_enabled: wingaEnabled,
    seller_winga_commission_rate: wingaEnabled ? ratePercent / 100 : 0.05,
    seller_wholesale_enabled: wholesaleEnabled,
    seller_wholesale_discount_percent: wholesaleDiscountPercent,
    seller_wholesale_minimum: wholesaleMinimum,
    seller_group_buy_enabled: groupBuyEnabled,
    seller_group_buy_minimum: groupBuyEnabled ? minimum : 3,
    updated_at: new Date().toISOString(),
  }).eq('id', id).eq('seller_profile_id', seller.id).eq('listing_status', 'approved').select('id').maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not save product promotion settings. Apply the latest marketplace migration.' }, { status: 503 });
  if (!data) return NextResponse.json({ error: 'Product status changed. Refresh and retry.' }, { status: 409 });
  return NextResponse.json({ ok: true });
}
