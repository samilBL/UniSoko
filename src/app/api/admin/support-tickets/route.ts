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
  if (!supabase) return NextResponse.json({ tickets: [], configured: false });
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load support tickets.' }, { status: 500 });
  return NextResponse.json({ tickets: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Not configured.' }, { status: 503 });
  let body: { id?: string; status?: string; adminNotes?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body.' }, { status: 400 }); }
  const validStatuses = ['Open', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed'];
  if (!body.id || (body.status && !validStatuses.includes(body.status)) ||
      typeof (body.adminNotes ?? '') !== 'string' || String(body.adminNotes || '').length > 3000) {
    return NextResponse.json({ error: 'Invalid ticket update.' }, { status: 400 });
  }
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status) updates.status = body.status;
  if (body.adminNotes !== undefined) updates.admin_notes = String(body.adminNotes).slice(0, 3000);
  const { data, error } = await supabase
    .from('support_tickets')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single();
  if (error || !data) return NextResponse.json({ error: 'Could not update ticket.' }, { status: 500 });
  await writeAdminAuditEvent(req, {
    action: `support_ticket.${(body.status || 'update').toLowerCase().replaceAll(' ', '_')}`,
    resourceType: 'support_ticket',
    resourceId: String(data.id),
    metadata: { status: data.status },
  });
  return NextResponse.json({ ticket: data }, { headers: { 'Cache-Control': 'no-store' } });
}
