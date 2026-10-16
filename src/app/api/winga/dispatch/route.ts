import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

async function currentWinga() {
  const auth = await getSupabaseServer();
  const db = getSupabaseAdmin();
  if (!auth || !db) return { response: NextResponse.json({ error: 'Winga dispatch is not configured.' }, { status: 503 }) };
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError || !user) return { response: NextResponse.json({ error: 'Sign in to the Winga portal.' }, { status: 401 }) };
  const { data: application, error } = await db.from('winga_applications').select('id,status').eq('user_id', user.id).maybeSingle();
  if (error) return { response: NextResponse.json({ error: 'Could not load Winga profile.' }, { status: 503 }) };
  if (!application || application.status !== 'Approved') return { response: NextResponse.json({ error: 'Approved Winga access is required.' }, { status: 403 }) };
  return { db, application };
}

export async function GET() {
  const winga = await currentWinga();
  if ('response' in winga) return winga.response;
  const { data: orders, error } = await winga.db.from('orders')
    .select('id,product_title,quantity,buyer_name,buyer_phone,university,delivery_spot_type,delivery_details,payment_status,fulfillment_status,delivery_status,dispatch_assignee_name,dispatch_assigned_at,created_at')
    .eq('dispatch_assignee_type', 'winga')
    .eq('dispatch_assignee_id', winga.application.id)
    .in('delivery_status', ['With Winga', 'Ready for Pickup'])
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: 'Could not load assigned dispatch orders. Apply the Phase 2 seller portal migration.' }, { status: 503 });
  return NextResponse.json({ orders: orders || [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  const winga = await currentWinga();
  if ('response' in winga) return winga.response;
  let body: { orderId?: unknown; deliveryStatus?: unknown };
  try { body = await request.json() as typeof body; } catch { return NextResponse.json({ error: 'Enter a valid dispatch update.' }, { status: 400 }); }
  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
  const deliveryStatus = body.deliveryStatus;
  if (!orderId || !['Ready for Pickup', 'Delivered'].includes(String(deliveryStatus))) {
    return NextResponse.json({ error: 'Choose a valid assigned order and delivery status.' }, { status: 400 });
  }
  const { data, error } = await winga.db.rpc('transition_assigned_winga_delivery', {
    target_order_id: orderId,
    assigned_winga_id: winga.application.id,
    next_delivery_status: deliveryStatus,
  });
  if (error) {
    const conflict = error.message.includes('invalid') || error.message.includes('assigned') || error.message.includes('ready');
    return NextResponse.json({ error: conflict ? 'That delivery update is not allowed for this order.' : 'Could not update this dispatch.' }, { status: conflict ? 409 : 503 });
  }
  const order = Array.isArray(data) ? data[0] : data;
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  return NextResponse.json({ order: { id: order.id, deliveryStatus: order.delivery_status, status: order.status } }, { headers: { 'Cache-Control': 'no-store' } });
}
