import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { writeAdminAuditEvent } from '@/lib/adminAudit';

export const dynamic = 'force-dynamic';
const CAMPAIGN_STATES = ['Under Review', 'Scheduled', 'Active', 'Completed', 'Rejected'];

export async function GET(request: NextRequest) {
  if (!isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Advertising management is not configured.' }, { status: 503 });
  const [{ data, error }, { data: methods, error: methodError }] = await Promise.all([
    supabase.from('advertising_inquiries').select('id,business_name,contact_person,phone,email,target_campuses,package_type,campaign_title,creative_url,destination_url,duration_weeks,budget,notes,amount_due,payment_method_id,transaction_reference,payment_status,payment_reviewed_at,payment_rejection_reason,campaign_status,campaign_start_at,campaign_end_at,status,created_at').order('created_at', { ascending: false }),
    supabase.from('payment_settings').select('id,name').order('display_order'),
  ]);
  if (error || methodError) return NextResponse.json({ error: 'Could not load advertising applications. Confirm the advertising and payment migrations have been applied.' }, { status: 503 });
  return NextResponse.json({ applications: data || [], paymentMethods: methods || [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  if (!isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const input = body as { id?: unknown; action?: unknown; campaignStatus?: unknown; startsAt?: unknown; endsAt?: unknown; reason?: unknown };
  const id = typeof input.id === 'string' ? input.id : '';
  const action = typeof input.action === 'string' ? input.action : '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Choose a valid application.' }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Advertising management is not configured.' }, { status: 503 });
  let update: Record<string, unknown>;
  if (action === 'verify_payment' || action === 'reject_payment') {
    const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
    if (action === 'reject_payment' && (reason.length < 3 || reason.length > 1000)) return NextResponse.json({ error: 'Add a payment rejection reason.' }, { status: 400 });
    update = action === 'verify_payment'
      ? { payment_status: 'Verified', payment_reviewed_at: new Date().toISOString(), payment_reviewed_by: process.env.ADMIN_USERNAME || 'admin', campaign_status: 'Under Review', status: 'Campaign Submitted' }
      : { payment_status: 'Rejected', payment_reviewed_at: new Date().toISOString(), payment_reviewed_by: process.env.ADMIN_USERNAME || 'admin', payment_rejection_reason: reason, status: 'Payment Rejected' };
    const { data, error } = await supabase.from('advertising_inquiries').update(update).eq('id', id).eq('payment_status', 'Submitted').select('id').maybeSingle();
    if (error || !data) return NextResponse.json({ error: 'This payment is no longer pending or could not be updated.' }, { status: 409 });
  } else if (action === 'update_campaign') {
    const campaignStatus = String(input.campaignStatus || '');
    if (!CAMPAIGN_STATES.includes(campaignStatus)) return NextResponse.json({ error: 'Choose a valid campaign status.' }, { status: 400 });
    const startsAt = typeof input.startsAt === 'string' && input.startsAt ? new Date(input.startsAt) : null;
    const endsAt = typeof input.endsAt === 'string' && input.endsAt ? new Date(input.endsAt) : null;
    if ((input.startsAt && (!startsAt || Number.isNaN(startsAt.getTime()))) || (input.endsAt && (!endsAt || Number.isNaN(endsAt.getTime()))) || (startsAt && endsAt && endsAt <= startsAt)) return NextResponse.json({ error: 'Enter a valid campaign schedule.' }, { status: 400 });
    if (['Scheduled', 'Active'].includes(campaignStatus) && (!startsAt || !endsAt)) return NextResponse.json({ error: 'Set both start and end dates before scheduling or activating a campaign.' }, { status: 400 });
    update = { campaign_status: campaignStatus, campaign_start_at: startsAt?.toISOString() || null, campaign_end_at: endsAt?.toISOString() || null, status: campaignStatus === 'Completed' ? 'Completed' : campaignStatus === 'Rejected' ? 'Rejected' : campaignStatus === 'Under Review' ? 'Campaign Submitted' : 'Approved', updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('advertising_inquiries').update(update).eq('id', id).eq('payment_status', 'Verified').select('id').maybeSingle();
    if (error || !data) return NextResponse.json({ error: 'Verify payment before managing this campaign.' }, { status: 409 });
  } else return NextResponse.json({ error: 'Choose a supported advertising action.' }, { status: 400 });
  await writeAdminAuditEvent(request, { action: `advertising.${action}`, resourceType: 'advertising_inquiry', resourceId: id, metadata: action === 'update_campaign' ? { campaignStatus: String(input.campaignStatus) } : { reason: typeof input.reason === 'string' ? input.reason : null } });
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
