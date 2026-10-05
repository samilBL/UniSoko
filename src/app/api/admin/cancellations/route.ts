import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { writeAdminAuditEvent } from '@/lib/adminAudit';

function isAdmin(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ requests: [], configured: false });
  const { data: requests, error } = await supabase.from('order_cancellation_requests').select('*').order('requested_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load cancellation requests.' }, { status: 500 });
  const orderIds = (requests || []).map((request) => request.order_id);
  const { data: orders, error: orderError } = orderIds.length
    ? await supabase.from('orders').select('id, buyer_name, buyer_phone, payment_status, total_amount, delivery_status, cancellation_status').in('id', orderIds)
    : { data: [], error: null };
  if (orderError) return NextResponse.json({ error: 'Could not load related orders.' }, { status: 500 });
  return NextResponse.json({
    requests: (requests || []).map((request) => {
      const order = orders?.find((item) => item.id === request.order_id);
      return {
        id: request.id,
        orderId: request.order_id,
        reason: request.reason,
        details: request.details,
        status: request.status,
        refundAmount: Number(request.refund_amount),
        refundReference: request.refund_reference,
        adminNotes: request.admin_notes,
        requestedAt: request.requested_at,
        reviewedAt: request.reviewed_at,
        buyerName: order?.buyer_name || '',
        buyerPhone: order?.buyer_phone || '',
        paymentStatus: order?.payment_status || '',
        orderTotal: Number(order?.total_amount || 0),
        deliveryStatus: order?.delivery_status || '',
      };
    }),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Cancellation review is not configured.' }, { status: 503 });
  let body: { id?: string; status?: string; refundAmount?: number; refundReference?: string; adminNotes?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid cancellation update.' }, { status: 400 }); }
  if (!body.id || !['Under Review', 'Approved', 'Rejected', 'Completed'].includes(body.status || '') ||
      !Number.isFinite(body.refundAmount ?? 0) || Number(body.refundAmount ?? 0) < 0 ||
      typeof (body.refundReference ?? '') !== 'string' || typeof (body.adminNotes ?? '') !== 'string' ||
      String(body.refundReference || '').length > 100 || String(body.adminNotes || '').length > 2_000) {
    return NextResponse.json({ error: 'Choose a valid request status and bounded refund details.' }, { status: 400 });
  }
  const { data, error } = await supabase.rpc('review_order_cancellation', {
    target_request_id: body.id,
    next_status: body.status,
    processed_refund_amount: Number(body.refundAmount || 0),
    processed_refund_reference: body.refundReference || '',
    review_notes: body.adminNotes || '',
  });
  if (error) {
    const message = error.message;
    const clientError = message.includes('invalid cancellation transition') || message.includes('require a full refund') ||
      message.includes('cannot receive a refund') || message.includes('may only be recorded');
    return NextResponse.json({ error: clientError ? 'That cancellation/refund transition or amount is not allowed.' : 'Could not update cancellation request.' }, { status: clientError ? 409 : 500 });
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return NextResponse.json({ error: 'Cancellation request not found.' }, { status: 404 });
  await writeAdminAuditEvent(request, {
    action: `order.cancellation.${String(row.status).toLowerCase().replaceAll(' ', '_')}`,
    resourceType: 'order_cancellation_request',
    resourceId: String(row.id),
    metadata: { orderId: String(row.order_id), refundAmount: Number(row.refund_amount || 0) },
  });
  return NextResponse.json({ request: { id: row.id, orderId: row.order_id, status: row.status, refundAmount: Number(row.refund_amount), refundReference: row.refund_reference, adminNotes: row.admin_notes } }, { headers: { 'Cache-Control': 'no-store' } });
}
