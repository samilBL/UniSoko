import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ALL_UNIVERSITIES, MOCK_PRODUCTS } from '@/lib/mockData';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { DeliverySpotType, OrderItem, Product } from '@/lib/types';
import { STUDENT_BUNDLES } from '@/lib/studentBundles';

const DELIVERY_SPOTS = new Set<DeliverySpotType>(['Hostel', 'Landmark', 'Off-Campus', 'Courier']);
const MAX_TEXT_LENGTH = 500;
const WINGA_DISCOUNT = 5000;
type SellerOrderSettings = { seller_profile_id: string; seller_wholesale_price: number | string | null; seller_group_buy_minimum: number | null; seller_winga_campaign_enabled: boolean; seller_winga_commission_rate: number | string };

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

  const buyerName = readText(body.buyerName, 120);
  const buyerPhone = readText(body.buyerPhone, 40);
  const campusId = readText(body.campusId, 80);
  const deliveryDetails = readText(body.deliveryDetails);
  const lipaNambaTxId = readText(body.lipaNambaTxId, 80)?.toUpperCase();
  const wingaCodeUsed = readText(body.wingaCodeUsed, 80)?.toUpperCase() || null;
  const deliverySpotType = body.deliverySpotType;
  const rawItems = body.items;

  if (!buyerName || !buyerPhone || !campusId || !deliveryDetails || !lipaNambaTxId ||
      !/^[A-Z0-9]{6,32}$/.test(lipaNambaTxId) ||
      typeof deliverySpotType !== 'string' || !DELIVERY_SPOTS.has(deliverySpotType as DeliverySpotType) ||
      !Array.isArray(rawItems) || rawItems.length < 1 || rawItems.length > 20) {
    return NextResponse.json({ error: 'Required order details are invalid.' }, { status: 400 });
  }

  const campus = ALL_UNIVERSITIES.find((item) => item.id === campusId);
  if (!campus) return NextResponse.json({ error: 'Choose a supported university or campus.' }, { status: 400 });
  if (campus.isMbeya ? deliverySpotType === 'Courier' : deliverySpotType !== 'Courier') {
    return NextResponse.json({ error: 'The delivery method does not match the selected campus.' }, { status: 400 });
  }

  const quantities = new Map<string, number>();
  for (const rawItem of rawItems) {
    if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
      return NextResponse.json({ error: 'One or more order items are invalid.' }, { status: 400 });
    }
    const item = rawItem as { productId?: unknown; quantity?: unknown };
    const productId = readText(item.productId, 120);
    const quantity = Number(item.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return NextResponse.json({ error: 'Each item needs a valid product and quantity.' }, { status: 400 });
    }
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  const items: OrderItem[] = [];
  for (const [productId, quantity] of quantities) {
    if (quantity > 100) return NextResponse.json({ error: 'Item quantity exceeds the checkout limit.' }, { status: 400 });
    let product = MOCK_PRODUCTS.find((candidate) => candidate.id === productId)
      || STUDENT_BUNDLES.find((candidate) => candidate.id === productId);
    let sellerSettings: SellerOrderSettings | null = null;
    if (!product) {
      const { data: sellerRow, error: sellerProductError } = await supabase.from('products')
        .select('id,name,description,category,price,seller_profile_id,seller_wholesale_price,seller_group_buy_minimum,seller_winga_campaign_enabled,seller_winga_commission_rate,in_stock,listing_status,is_active')
        .eq('id', productId).not('seller_profile_id', 'is', null).eq('listing_status', 'approved').eq('is_active', true).eq('in_stock', true).maybeSingle();
      if (sellerProductError) return NextResponse.json({ error: 'Seller product checkout is unavailable. Apply the latest marketplace migration.' }, { status: 503 });
      if (sellerRow?.seller_profile_id) {
        const { data: seller } = await supabase.from('seller_profiles').select('status').eq('id', sellerRow.seller_profile_id).maybeSingle();
        if (seller?.status === 'approved') {
          sellerSettings = sellerRow as SellerOrderSettings;
          product = { id: sellerRow.id, title: sellerRow.name, description: sellerRow.description || '', category: sellerRow.category as Product['category'], priceRetail: Number(sellerRow.price), priceWholesale: Number(sellerRow.seller_wholesale_price || sellerRow.price), condition: 'Brand New', stockStatus: 'In Stock', images: [], minWholesaleQty: Number(sellerRow.seller_group_buy_minimum || 3) };
        }
      }
    }
    if (!product) return NextResponse.json({ error: 'A product in your cart is no longer available.' }, { status: 409 });
    if (product.stockStatus === 'Coming Soon') return NextResponse.json({ error: `${product.title} is not currently available.` }, { status: 409 });
    const minimumWholesaleQuantity = product.minWholesaleQty || 3;
    const unitPrice = quantity >= minimumWholesaleQuantity ? product.priceWholesale : product.priceRetail;
    items.push({
      productId: product.id,
      productTitle: product.title,
      condition: product.condition,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
      sellerProfileId: sellerSettings?.seller_profile_id || null,
      wingaCommissionRate: sellerSettings ? sellerSettings.seller_winga_campaign_enabled ? Number(sellerSettings.seller_winga_commission_rate) : 0 : 0.05,
    });
  }

  const subtotalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);
  if (wingaCodeUsed && items.some((item) => item.sellerProfileId && !(Number(item.wingaCommissionRate) > 0))) {
    return NextResponse.json({ error: 'A Winga code can only be used with seller products whose owners have enabled a promotion campaign.' }, { status: 400 });
  }
  const shippingFee = campus.isMbeya ? 0 : 7000;
  let promoDiscount = 0;
  if (wingaCodeUsed) {
    const { data: approvedWinga, error: promoError } = await supabase
      .from('winga_applications')
      .select('promo_code')
      .eq('promo_code', wingaCodeUsed)
      .eq('status', 'Approved')
      .maybeSingle();
    if (promoError) return NextResponse.json({ error: 'Winga codes are temporarily unavailable. Retry without the code or contact support.' }, { status: 503 });
    if (!approvedWinga) return NextResponse.json({ error: 'This Winga code is invalid or inactive.' }, { status: 400 });
    promoDiscount = Math.min(WINGA_DISCOUNT, subtotalAmount);
  }
  let tradeInRequestId: string | null = null;
  let tradeInEstimate = 0;
  if (body.tradeIn !== undefined && body.tradeIn !== null) {
    if (typeof body.tradeIn !== 'object' || Array.isArray(body.tradeIn)) {
      return NextResponse.json({ error: 'Trade-in estimate is invalid.' }, { status: 400 });
    }
    const tradeIn = body.tradeIn as { requestId?: unknown; token?: unknown };
    const requestId = readText(tradeIn.requestId, 120);
    const token = readText(tradeIn.token, 64);
    if (!requestId || !token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      return NextResponse.json({ error: 'Trade-in estimate is invalid or expired.' }, { status: 400 });
    }
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const { data: tradeInRequest, error: tradeInError } = await supabase
      .from('trade_in_requests')
      .select('id, expected_price, expires_at')
      .eq('id', requestId)
      .eq('quote_token_hash', tokenHash)
      .eq('status', 'Pending Review')
      .maybeSingle();
    if (tradeInError) return NextResponse.json({ error: 'Trade-in estimates are temporarily unavailable.' }, { status: 503 });
    if (!tradeInRequest || !tradeInRequest.expires_at || new Date(tradeInRequest.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Trade-in estimate is invalid or expired. Request a new estimate.' }, { status: 409 });
    }
    tradeInRequestId = tradeInRequest.id;
    tradeInEstimate = Math.min(Math.max(0, Math.round(Number(tradeInRequest.expected_price))), subtotalAmount);
  }
  const totalAmount = Math.max(0, subtotalAmount + shippingFee - promoDiscount - tradeInEstimate);

  const orderId = `ORD-TZ-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const trackingToken = randomUUID().replaceAll('-', '') + randomUUID().replaceAll('-', '').slice(0, 11);
  const trackingTokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(trackingToken));
  const trackingTokenHashHex = Array.from(new Uint8Array(trackingTokenHash), (byte) => byte.toString(16).padStart(2, '0')).join('');

  const { error: orderError } = await supabase.from('orders').insert({
    id: orderId,
    tracking_token_hash: trackingTokenHashHex,
    product_id: items[0].productId,
    product_title: items[0].productTitle,
    campus_id: campus.id,
    buyer_name: buyerName,
    buyer_phone: buyerPhone,
    university: `${campus.name} (${campus.shortCode})`,
    delivery_spot_type: deliverySpotType,
    delivery_details: deliveryDetails,
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal_amount: subtotalAmount,
    shipping_fee: shippingFee,
    promo_discount: promoDiscount,
    trade_in_request_id: tradeInRequestId,
    trade_in_estimate: tradeInEstimate,
    trade_in_inspection_status: tradeInRequestId ? 'Trade-In Pending Inspection' : 'Not Required',
    total_amount: totalAmount,
    winga_code_used: wingaCodeUsed,
    lipa_namba_tx_id: lipaNambaTxId,
    status: 'Pending Verification',
    payment_status: 'Submitted',
    fulfillment_status: 'Unconfirmed',
    delivery_status: 'Not Dispatched',
  });

  if (orderError) {
    if (orderError.code === '23505') return NextResponse.json({ error: tradeInRequestId ? 'This transaction reference was already used or the trade-in estimate was already applied.' : 'This transaction reference has already been submitted.' }, { status: 409 });
    return NextResponse.json({ error: 'Could not save this order for tracking. Please retry.' }, { status: 500 });
  }

  const { error: itemError } = await supabase.from('order_items').insert(items.map((item) => ({
    order_id: orderId,
    product_id: item.productId,
    product_title: item.productTitle,
    condition: item.condition,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    line_total: item.lineTotal,
    seller_profile_id: item.sellerProfileId || null,
    winga_commission_rate: item.wingaCommissionRate ?? 0.05,
  })));
  if (itemError) {
    await supabase.from('orders').delete().eq('id', orderId);
    return NextResponse.json({ error: 'Could not save the order items. Please retry.' }, { status: 500 });
  }

  const { error: historyError } = await supabase.from('order_status_history').insert({
    order_id: orderId,
    status_type: 'payment',
    status: 'Submitted',
    label: 'Payment Submitted',
    changed_by: 'customer',
  });
  if (historyError) {
    await supabase.from('orders').delete().eq('id', orderId);
    return NextResponse.json({ error: 'Could not initialize order tracking. Please retry.' }, { status: 500 });
  }

  return NextResponse.json({ orderId, trackingToken, items, subtotalAmount, shippingFee, promoDiscount, tradeInRequestId, tradeInEstimate, totalAmount }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
