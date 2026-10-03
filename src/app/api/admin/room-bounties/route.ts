import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { hasAdminRequestSession } from '@/lib/adminAuth';
import { writeAdminAuditEvent } from '@/lib/adminAudit';

function isAdmin(request: NextRequest) {
  return hasAdminRequestSession(request);
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ submissions: [], configured: false });
  const { data, error } = await supabase.from('room_bounty_submissions').select('*').order('submitted_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load room leads.' }, { status: 500 });
  const submissions = (data || []).map((row) => ({
    id: row.id,
    studentName: row.student_name,
    phone: row.phone,
    university: row.university,
    location: row.location,
    landlordName: row.landlord_name,
    landlordPhone: row.landlord_phone,
    details: row.details,
    bountyAmount: Number(row.bounty_amount),
    status: row.status,
    payoutStatus: row.payout_status,
    submittedAt: row.submitted_at,
    leasedAt: row.leased_at,
    paidAt: row.paid_at,
    adminNotes: row.admin_notes,
  }));
  return NextResponse.json({ submissions }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Room finder submissions are not configured.' }, { status: 503 });
  let body: { id?: string; status?: string; payoutStatus?: string; bountyAmount?: number; adminNotes?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid bounty update.' }, { status: 400 }); }
  if (!body.id || !['Pending', 'Verifying', 'Leased', 'Rejected'].includes(body.status || '') ||
      !Number.isFinite(body.bountyAmount) || Number(body.bountyAmount) < 0 || typeof body.adminNotes !== 'string') {
    return NextResponse.json({ error: 'Enter a valid lead status, bounty, and note.' }, { status: 400 });
  }
  if (body.status === 'Leased' && Number(body.bountyAmount) <= 0) {
    return NextResponse.json({ error: 'Set the agreed finder’s fee before marking a room leased.' }, { status: 400 });
  }
  const { data: existing, error: lookupError } = await supabase.from('room_bounty_submissions')
    .select('status, payout_status')
    .eq('id', body.id)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: 'Could not load this room lead.' }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'Room lead not found.' }, { status: 404 });

  const payoutStatus = body.status === 'Leased' ? 'Due'
    : body.payoutStatus === 'Paid' && existing.status === 'Leased' && existing.payout_status === 'Due' ? 'Paid'
      : 'Not Due';
  if (body.payoutStatus === 'Paid' && payoutStatus !== 'Paid') {
    return NextResponse.json({ error: 'A finder’s fee is payable only after a room has been leased.' }, { status: 409 });
  }
  const { error } = await supabase.from('room_bounty_submissions').update({
    status: body.status,
    bounty_amount: Number(body.bountyAmount),
    payout_status: payoutStatus,
    admin_notes: body.adminNotes.slice(0, 1000),
    leased_at: body.status === 'Leased' ? new Date().toISOString() : null,
    paid_at: payoutStatus === 'Paid' ? new Date().toISOString() : null,
  }).eq('id', body.id);
  if (error) return NextResponse.json({ error: 'Could not update room lead.' }, { status: 500 });
  await writeAdminAuditEvent(request, { action: 'room_bounty.update', resourceType: 'room_bounty_submission', resourceId: body.id, metadata: { status: String(body.status), payoutStatus, bountyAmount: Number(body.bountyAmount) } });
  return NextResponse.json({ ok: true, payoutStatus });
}
