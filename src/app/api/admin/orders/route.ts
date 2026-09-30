import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { ORDER_STATUS_LABELS } from '@/lib/orderTracking';
import type { Order, OrderStatusEvent } from '@/lib/types';

function isAdmin(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

function mapOrder(row: Record<string, unknown>, events: OrderStatusEvent[] = []): Order {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    productTitle: String(row.product_title),
    buyerName: String(row.buyer_name),
    buyerPhone: String(row.buyer_phone),
    university: String(row.university),
    deliverySpotType: row.delivery_spot_type as Order['deliverySpotType'],
    deliveryDetails: String(row.delivery_details),
    quantity: Number(row.quantity),
    totalAmount: Number(row.total_amount),
    wingaCodeUsed: typeof row.winga_code_used === 'string' ? row.winga_code_used : undefined,
    lipaNambaTxId: String(row.lipa_namba_tx_id),
    itemSerialNumber: typeof row.item_serial_number === 'string' ? row.item_serial_number : undefined,
    warrantyDays: row.warranty_days === 30 || row.warranty_days === 60 || row.warranty_days === 90 ? row.warranty_days : undefined,
    approvedAt: typeof row.approved_at === 'string' ? row.approved_at : undefined,
    status: row.status as Order['status'],
    paymentStatus: row.payment_status as Order['paymentStatus'],
    fulfillmentStatus: row.fulfillment_status as Order['fulfillmentStatus'],
    deliveryStatus: row.delivery_status as Order['deliveryStatus'],
    statusHistory: events,
    createdAt: String(row.created_at),
  };
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ orders: [], configured: false });

  const { data: rows, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load orders.' }, { status: 500 });
  if (!rows?.length) return NextResponse.json({ orders: [], configured: true }, { headers: { 'Cache-Control': 'no-store' } });
  const { data: history, error: historyError } = await supabase
    .from('order_status_history')
    .select('order_id, status_type, status, label, changed_by, changed_at')
    .in('order_id', (rows || []).map((row) => row.id))
    .order('changed_at', { ascending: true });
  if (historyError) return NextResponse.json({ error: 'Could not load order history.' }, { status: 500 });

  const orders = (rows || []).map((row) => mapOrder(row, (history || [])
    .filter((event) => event.order_id === row.id)
    .map((event) => ({
      statusType: event.status_type as OrderStatusEvent['statusType'],
      status: event.status,
      label: event.label,
      changedBy: event.changed_by as OrderStatusEvent['changedBy'],
      changedAt: event.changed_at,
    }))));
  return NextResponse.json({ orders, configured: true }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Order tracking is not configured yet.' }, { status: 503 });

  let body: { id?: string; statusType?: string; status?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid order update.' }, { status: 400 }); }
  const allowed = body.statusType && Object.hasOwn(ORDER_STATUS_LABELS, body.statusType)
    ? ORDER_STATUS_LABELS[body.statusType as keyof typeof ORDER_STATUS_LABELS]
    : [];
  if (!body.id || !body.status || !allowed.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid order update.' }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('transition_order_status', {
    target_order_id: body.id,
    next_status_type: body.statusType,
    next_status: body.status,
  });
  if (error) {
    const invalidTransition = error.message.includes('invalid') || error.message.includes('requires');
    return NextResponse.json({ error: invalidTransition ? 'That order status transition is not allowed.' : 'Could not update this order.' }, { status: invalidTransition ? 409 : 500 });
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  const { data: events, error: historyError } = await supabase
    .from('order_status_history')
    .select('status_type, status, label, changed_by, changed_at')
    .eq('order_id', body.id)
    .order('changed_at', { ascending: true });
  if (historyError) return NextResponse.json({ error: 'Order changed, but history could not be loaded.' }, { status: 500 });
  const order = mapOrder(row, (events || []).map((event) => ({
    statusType: event.status_type as OrderStatusEvent['statusType'],
    status: event.status,
    label: event.label,
    changedBy: event.changed_by as OrderStatusEvent['changedBy'],
    changedAt: event.changed_at,
  })));
  return NextResponse.json({ order }, { headers: { 'Cache-Control': 'no-store' } });
}