import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { ORDER_STATUS_LABELS } from '@/lib/orderTracking';
import { writeAdminAuditEvent } from '@/lib/adminAudit';
import type { Order, OrderStatusEvent } from '@/lib/types';

function isAdmin(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

function mapOrder(row: Record<string, unknown>, events: OrderStatusEvent[] = [], items: Order['items'] = []): Order {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    productTitle: String(row.product_title),
    buyerName: String(row.buyer_name),
    buyerPhone: String(row.buyer_phone),
    university: String(row.university),
    items,
    deliverySpotType: row.delivery_spot_type as Order['deliverySpotType'],
    deliveryDetails: String(row.delivery_details),
    quantity: Number(row.quantity),
    subtotalAmount: Number(row.subtotal_amount),
    shippingFee: Number(row.shipping_fee),
    promoDiscount: Number(row.promo_discount),
    tradeInRequestId: typeof row.trade_in_request_id === 'string' ? row.trade_in_request_id : undefined,
    tradeInEstimate: Number(row.trade_in_estimate || 0),
    tradeInInspectionStatus: row.trade_in_inspection_status as Order['tradeInInspectionStatus'],
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
    dispatchAssigneeType: row.dispatch_assignee_type as Order['dispatchAssigneeType'],
    dispatchAssigneeId: typeof row.dispatch_assignee_id === 'string' ? row.dispatch_assignee_id : undefined,
    dispatchAssigneeName: typeof row.dispatch_assignee_name === 'string' ? row.dispatch_assignee_name : undefined,
    dispatchAssignedAt: typeof row.dispatch_assigned_at === 'string' ? row.dispatch_assigned_at : undefined,
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
  const [{ data: history, error: historyError }, { data: itemRows, error: itemError }] = await Promise.all([
    supabase
    .from('order_status_history')
    .select('order_id, status_type, status, label, changed_by, changed_at')
    .in('order_id', (rows || []).map((row) => row.id))
    .order('changed_at', { ascending: true }),
    supabase
      .from('order_items')
      .select('order_id, product_id, product_title, condition, quantity, unit_price, line_total')
      .in('order_id', rows.map((row) => row.id))
      .order('id', { ascending: true }),
  ]);
  if (historyError) return NextResponse.json({ error: 'Could not load order history.' }, { status: 500 });
  if (itemError) return NextResponse.json({ error: 'Could not load order items.' }, { status: 500 });

  const orders = (rows || []).map((row) => mapOrder(row, (history || [])
    .filter((event) => event.order_id === row.id)
    .map((event) => ({
      statusType: event.status_type as OrderStatusEvent['statusType'],
      status: event.status,
      label: event.label,
      changedBy: event.changed_by as OrderStatusEvent['changedBy'],
      changedAt: event.changed_at,
    })), (itemRows || []).filter((item) => item.order_id === row.id).map((item) => ({
      productId: item.product_id,
      productTitle: item.product_title,
      condition: item.condition as NonNullable<Order['items']>[number]['condition'],
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      lineTotal: Number(item.line_total),
    }))));
  return NextResponse.json({ orders, configured: true }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Order tracking is not configured yet.' }, { status: 503 });

  let body: { id?: string; statusType?: string; status?: string; action?: string; assigneeType?: string; assigneeId?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid order update.' }, { status: 400 }); }
  if (body.action === 'assign_dispatch') {
    if (!body.id || !['winga', 'dispatch_team', 'courier'].includes(String(body.assigneeType))) return NextResponse.json({ error: 'Choose an order and a dispatch assignee.' }, { status: 400 });
    const { data: current, error: lookupError } = await supabase.from('orders')
      .select('id,payment_status,fulfillment_status,delivery_status')
      .eq('id', body.id)
      .maybeSingle();
    if (lookupError) return NextResponse.json({ error: 'Could not load this order for dispatch.' }, { status: 500 });
    if (!current) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    if (current.payment_status !== 'Verified' || current.fulfillment_status !== 'Ready for Dispatch' || current.delivery_status === 'Delivered') {
      return NextResponse.json({ error: 'Verify payment and mark the order ready before assigning dispatch.' }, { status: 409 });
    }

    let assigneeId = '';
    let assigneeName = '';
    const assigneeType = body.assigneeType as 'winga' | 'dispatch_team' | 'courier';
    if (assigneeType === 'winga') {
      if (!body.assigneeId) return NextResponse.json({ error: 'Choose an approved Winga.' }, { status: 400 });
      const { data: winga, error: wingaError } = await supabase.from('winga_applications')
        .select('id,full_name').eq('id', body.assigneeId).eq('status', 'Approved').maybeSingle();
      if (wingaError) return NextResponse.json({ error: 'Could not verify this Winga.' }, { status: 503 });
      if (!winga) return NextResponse.json({ error: 'Only approved Wingas can be assigned.' }, { status: 400 });
      assigneeId = winga.id;
      assigneeName = winga.full_name;
    } else {
      const teams: Record<string, string> = {
        campus_dispatch: 'UniSoko Campus Dispatch',
        regional_courier: 'Regional Courier Team',
      };
      const teamId = body.assigneeId || '';
      if (!teams[teamId]) return NextResponse.json({ error: 'Choose an available dispatch team.' }, { status: 400 });
      assigneeId = teamId;
      assigneeName = teams[teamId];
    }

    const now = new Date().toISOString();
    const auditReady = await writeAdminAuditEvent(request, {
      action: 'order.dispatch.assigned',
      resourceType: 'order',
      resourceId: body.id,
      metadata: { assigneeType, assigneeId, assigneeName },
    });
    if (!auditReady) return NextResponse.json({ error: 'Audit logging is unavailable; no dispatch assignment was saved.' }, { status: 503 });
    const { data: assigned, error: assignmentError } = await supabase.from('orders').update({
      dispatch_assignee_type: assigneeType,
      dispatch_assignee_id: assigneeId,
      dispatch_assignee_name: assigneeName,
      dispatch_assigned_at: now,
      updated_at: now,
    }).eq('id', body.id).eq('payment_status', 'Verified').eq('fulfillment_status', 'Ready for Dispatch')
      .select('dispatch_assignee_type,dispatch_assignee_id,dispatch_assignee_name,dispatch_assigned_at').maybeSingle();
    if (assignmentError) return NextResponse.json({ error: 'Could not save the dispatch assignment. Apply the Phase 2 seller portal migration.' }, { status: 503 });
    if (!assigned) return NextResponse.json({ error: 'Order status changed. Refresh and retry dispatch assignment.' }, { status: 409 });
    return NextResponse.json({ assignment: assigned }, { headers: { 'Cache-Control': 'no-store' } });
  }
  const allowed = body.statusType && Object.hasOwn(ORDER_STATUS_LABELS, body.statusType)
    ? ORDER_STATUS_LABELS[body.statusType as keyof typeof ORDER_STATUS_LABELS]
    : [];
  if (!body.id || !body.status || !allowed.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid order update.' }, { status: 400 });
  }

  if ((body.statusType === 'delivery' || body.statusType === 'fulfillment' && body.status === 'Ready for Dispatch')) {
    const { data: existingOrder, error: orderLookupError } = await supabase
      .from('orders')
      .select('trade_in_inspection_status')
      .eq('id', body.id)
      .maybeSingle();
    if (orderLookupError) return NextResponse.json({ error: 'Could not verify trade-in inspection status.' }, { status: 500 });
    if (existingOrder?.trade_in_inspection_status && existingOrder.trade_in_inspection_status !== 'Not Required' && existingOrder.trade_in_inspection_status !== 'Inspected') {
      return NextResponse.json({ error: 'Complete and accept the physical trade-in inspection before dispatch.' }, { status: 409 });
    }
  }

  const auditReady = await writeAdminAuditEvent(request, {
    action: 'order.status.transition.requested',
    resourceType: 'order',
    resourceId: body.id,
    metadata: { statusType: body.statusType ?? null, status: body.status ?? null },
  });
  if (!auditReady) return NextResponse.json({ error: 'Audit logging is unavailable; no order change was made.' }, { status: 503 });

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
  const [{ data: events, error: historyError }, { data: items, error: itemError }] = await Promise.all([
    supabase
    .from('order_status_history')
    .select('status_type, status, label, changed_by, changed_at')
    .eq('order_id', body.id)
    .order('changed_at', { ascending: true }),
    supabase
      .from('order_items')
      .select('product_id, product_title, condition, quantity, unit_price, line_total')
      .eq('order_id', body.id)
      .order('id', { ascending: true }),
  ]);
  if (historyError) return NextResponse.json({ error: 'Order changed, but history could not be loaded.' }, { status: 500 });
  if (itemError) return NextResponse.json({ error: 'Order changed, but items could not be loaded.' }, { status: 500 });
  const order = mapOrder(row, (events || []).map((event) => ({
    statusType: event.status_type as OrderStatusEvent['statusType'],
    status: event.status,
    label: event.label,
    changedBy: event.changed_by as OrderStatusEvent['changedBy'],
    changedAt: event.changed_at,
  })), (items || []).map((item) => ({
    productId: item.product_id,
    productTitle: item.product_title,
    condition: item.condition as NonNullable<Order['items']>[number]['condition'],
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
    lineTotal: Number(item.line_total),
  })));
  return NextResponse.json({ order }, { headers: { 'Cache-Control': 'no-store' } });
}