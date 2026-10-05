import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Order tracking is not configured yet.' }, { status: 503 });

  const token = request.nextUrl.searchParams.get('token') || '';
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return NextResponse.json({ error: 'This tracking link is invalid.' }, { status: 404 });

  const { id } = await context.params;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, product_id, product_title, campus_id, buyer_name, buyer_phone, university, delivery_spot_type, delivery_details, quantity, subtotal_amount, shipping_fee, promo_discount, trade_in_request_id, trade_in_estimate, trade_in_inspection_status, cancellation_status, total_amount, winga_code_used, lipa_namba_tx_id, item_serial_number, warranty_days, status, payment_status, fulfillment_status, delivery_status, created_at, approved_at')
    .eq('id', id)
    .eq('tracking_token_hash', tokenHash)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not load this order.' }, { status: 500 });
  if (!order) return NextResponse.json({ error: 'This tracking link is invalid or has expired.' }, { status: 404 });

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('product_id, product_title, condition, quantity, unit_price, line_total')
    .eq('order_id', id)
    .order('id', { ascending: true });
  if (itemsError) return NextResponse.json({ error: 'Could not load this order’s items.' }, { status: 500 });

  const { data: events, error: historyError } = await supabase
    .from('order_status_history')
    .select('status_type, status, label, changed_by, changed_at')
    .eq('order_id', id)
    .order('changed_at', { ascending: true });
  if (historyError) return NextResponse.json({ error: 'Could not load this order timeline.' }, { status: 500 });

  return NextResponse.json({
    order: {
      id: order.id,
      productId: order.product_id,
      productTitle: order.product_title,
      buyerName: order.buyer_name,
      buyerPhone: order.buyer_phone,
      university: order.university,
      campusId: order.campus_id,
      deliverySpotType: order.delivery_spot_type,
      deliveryDetails: order.delivery_details,
      quantity: order.quantity,
      items: (items || []).map((item) => ({
        productId: item.product_id,
        productTitle: item.product_title,
        condition: item.condition,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        lineTotal: Number(item.line_total),
      })),
      subtotalAmount: Number(order.subtotal_amount),
      shippingFee: Number(order.shipping_fee),
      promoDiscount: Number(order.promo_discount),
      tradeInRequestId: order.trade_in_request_id || undefined,
      tradeInEstimate: Number(order.trade_in_estimate || 0),
      tradeInInspectionStatus: order.trade_in_inspection_status,
      cancellationStatus: order.cancellation_status,
      totalAmount: Number(order.total_amount),
      wingaCodeUsed: order.winga_code_used,
      lipaNambaTxId: order.lipa_namba_tx_id,
      itemSerialNumber: order.item_serial_number,
      warrantyDays: order.warranty_days,
      status: order.status,
      paymentStatus: order.payment_status,
      fulfillmentStatus: order.fulfillment_status,
      deliveryStatus: order.delivery_status,
      createdAt: order.created_at,
      approvedAt: order.approved_at,
      statusHistory: (events || []).map((event) => ({
        statusType: event.status_type,
        status: event.status,
        label: event.label,
        changedBy: event.changed_by,
        changedAt: event.changed_at,
      })),
    },
  }, { headers: { 'Cache-Control': 'no-store' } });
}