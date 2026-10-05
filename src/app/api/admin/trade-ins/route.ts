import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { hasAdminRequestSession } from '@/lib/adminAuth';
import { writeAdminAuditEvent } from '@/lib/adminAudit';

const ALLOWED_STATUSES = new Set(['Pending Review', 'Inspecting', 'Offer Made', 'Accepted', 'Rejected']);

export async function GET(request: NextRequest) {
  if (!hasAdminRequestSession(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ requests: [], configured: false });

  const { data, error } = await supabase.from('trade_in_requests').select('*').order('submitted_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load trade-in requests.' }, { status: 500 });

  const { data: linkedOrders, error: linkedOrdersError } = data?.length
    ? await supabase.from('orders').select('id, trade_in_request_id').in('trade_in_request_id', data.map((row) => row.id))
    : { data: [], error: null };
  if (linkedOrdersError) return NextResponse.json({ error: 'Could not load linked trade-in orders.' }, { status: 500 });

  const requests = await Promise.all((data || []).map(async (row) => {
    const imageUrls = await Promise.all(((row.image_paths || []) as string[]).map(async (path) => {
      const { data: signed } = await supabase.storage.from('trade-in-photos').createSignedUrl(path, 60 * 10);
      return signed?.signedUrl || '';
    }));
    return {
      id: row.id,
      orderId: linkedOrders?.find((order) => order.trade_in_request_id === row.id)?.id,
      studentName: row.student_name,
      phone: row.phone,
      university: row.university,
      itemTitle: row.item_title,
      category: row.category,
      condition: row.condition,
      specs: row.specs,
      expectedPrice: row.expected_price,
      offeredPrice: row.offered_price,
      imageUrls: imageUrls.filter(Boolean),
      status: row.status,
      adminNotes: row.admin_notes,
      submittedAt: row.submitted_at,
    };
  }));

  return NextResponse.json({ requests, configured: true }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  if (!hasAdminRequestSession(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Trade-in database is not configured.' }, { status: 503 });

  let body: { id?: string; status?: string; adminNotes?: string; offeredPrice?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (!body.id || !body.status || !ALLOWED_STATUSES.has(body.status)) return NextResponse.json({ error: 'Invalid trade-in update.' }, { status: 400 });

  const { error } = await supabase.from('trade_in_requests').update({
    status: body.status,
    admin_notes: body.adminNotes || '',
    offered_price: Number.isFinite(body.offeredPrice) ? body.offeredPrice : null,
  }).eq('id', body.id);
  if (error) return NextResponse.json({ error: 'Could not update trade-in request.' }, { status: 500 });
  if (body.status === 'Accepted' || body.status === 'Rejected') {
    const { data: linkedOrder, error: lookupError } = await supabase.from('orders')
      .select('id')
      .eq('trade_in_request_id', body.id)
      .maybeSingle();
    if (lookupError) return NextResponse.json({ error: 'Trade-in decision saved, but its order status could not be updated.' }, { status: 500 });
    if (linkedOrder) {
      const { error: orderUpdateError } = await supabase.from('orders').update({
        trade_in_inspection_status: body.status === 'Accepted' ? 'Inspected' : 'Rejected',
      }).eq('id', linkedOrder.id);
      if (orderUpdateError) return NextResponse.json({ error: 'Trade-in decision saved, but its order status could not be updated.' }, { status: 500 });
    }
  }
  await writeAdminAuditEvent(request, {
    action: 'trade_in.review',
    resourceType: 'trade_in_request',
    resourceId: body.id,
    metadata: { status: body.status, offeredPrice: Number.isFinite(body.offeredPrice) ? Number(body.offeredPrice) : null },
  });
  return NextResponse.json({ ok: true });
}
