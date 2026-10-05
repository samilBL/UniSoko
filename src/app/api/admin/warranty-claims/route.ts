import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { writeAdminAuditEvent } from '@/lib/adminAudit';

function isAdmin(req: NextRequest) {
  return isValidAdminSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ claims: [], configured: false });
  const { data, error } = await supabase
    .from('warranty_claims')
    .select('*')
    .order('submitted_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load warranty claims.' }, { status: 500 });
  return NextResponse.json({ claims: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Not configured.' }, { status: 503 });
  let body: { id?: string; status?: string; resolution?: string; adminNotes?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body.' }, { status: 400 }); }
  const validStatuses = ['Submitted', 'Under Review', 'Return Received', 'Inspecting', 'Resolved', 'Rejected'];
  const validResolutions = ['Replacement', 'Repair', 'Refund', 'Rejected'];
  if (!body.id || (body.status && !validStatuses.includes(body.status)) ||
      (body.resolution && !validResolutions.includes(body.resolution)) ||
      typeof (body.adminNotes ?? '') !== 'string' || String(body.adminNotes || '').length > 3000) {
    return NextResponse.json({ error: 'Invalid warranty claim update.' }, { status: 400 });
  }
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {};
  if (body.status) {
    updates.status = body.status;
    if (body.status === 'Under Review') updates.reviewed_at = now;
    if (body.status === 'Resolved' || body.status === 'Rejected') updates.resolved_at = now;
  }
  if (body.resolution) updates.resolution = body.resolution;
  if (body.adminNotes !== undefined) updates.admin_notes = String(body.adminNotes).slice(0, 3000);
  const { data, error } = await supabase
    .from('warranty_claims')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single();
  if (error || !data) return NextResponse.json({ error: 'Could not update warranty claim.' }, { status: 500 });
  await writeAdminAuditEvent(req, {
    action: `warranty_claim.${(body.status || 'update').toLowerCase().replaceAll(' ', '_')}`,
    resourceType: 'warranty_claim',
    resourceId: String(data.id),
    metadata: { orderId: String(data.order_id), status: data.status, resolution: data.resolution || '' },
  });
  return NextResponse.json({ claim: data }, { headers: { 'Cache-Control': 'no-store' } });
}
