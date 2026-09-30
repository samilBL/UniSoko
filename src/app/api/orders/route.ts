import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { DeliverySpotType } from '@/lib/types';

const DELIVERY_SPOTS = new Set<DeliverySpotType>(['Hostel', 'Landmark', 'Off-Campus', 'Courier']);
const MAX_TEXT_LENGTH = 500;

function readText(value: unknown, maxLength = MAX_TEXT_LENGTH) {
  return typeof value === 'string' && value.trim() && value.length <= maxLength ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Order tracking is not configured yet.' }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid payload.');
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid order request.' }, { status: 400 });
  }

  const id = readText(body.id, 80);
  const productId = readText(body.productId, 120);
  const productTitle = readText(body.productTitle, 200);
  const buyerName = readText(body.buyerName, 120);
  const buyerPhone = readText(body.buyerPhone, 40);
  const university = readText(body.university, 160);
  const deliveryDetails = readText(body.deliveryDetails);
  const lipaNambaTxId = readText(body.lipaNambaTxId, 80);
  const deliverySpotType = body.deliverySpotType;
  const quantity = Number(body.quantity);
  const totalAmount = Number(body.totalAmount);
  const wingaCodeUsed = readText(body.wingaCodeUsed, 80);

  if (!id || !productId || !productTitle || !buyerName || !buyerPhone || !university || !deliveryDetails || !lipaNambaTxId ||
      typeof deliverySpotType !== 'string' || !DELIVERY_SPOTS.has(deliverySpotType as DeliverySpotType) ||
      !Number.isInteger(quantity) || quantity < 1 || quantity > 100 ||
      !Number.isFinite(totalAmount) || totalAmount < 0 || totalAmount > 100_000_000) {
    return NextResponse.json({ error: 'Required order details are invalid.' }, { status: 400 });
  }

  const trackingToken = randomBytes(32).toString('base64url');
  const trackingTokenHash = createHash('sha256').update(trackingToken).digest('hex');
  const { error: orderError } = await supabase.from('orders').insert({
    id,
    tracking_token_hash: trackingTokenHash,
    product_id: productId,
    product_title: productTitle,
    buyer_name: buyerName,
    buyer_phone: buyerPhone,
    university,
    delivery_spot_type: deliverySpotType,
    delivery_details: deliveryDetails,
    quantity,
    total_amount: totalAmount,
    winga_code_used: wingaCodeUsed,
    lipa_namba_tx_id: lipaNambaTxId,
    status: 'Pending Verification',
    payment_status: 'Submitted',
    fulfillment_status: 'Unconfirmed',
    delivery_status: 'Not Dispatched',
  });

  if (orderError) {
    const conflict = orderError.code === '23505';
    return NextResponse.json({ error: conflict ? 'This order was already submitted.' : 'Could not save this order for tracking.' }, { status: conflict ? 409 : 500 });
  }

  const { error: historyError } = await supabase.from('order_status_history').insert({
    order_id: id,
    status_type: 'payment',
    status: 'Submitted',
    label: 'Payment Submitted',
    changed_by: 'customer',
  });
  if (historyError) {
    await supabase.from('orders').delete().eq('id', id);
    return NextResponse.json({ error: 'Could not initialize order tracking.' }, { status: 500 });
  }

  return NextResponse.json({ trackingToken }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}