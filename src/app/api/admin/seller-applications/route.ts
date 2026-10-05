import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/adminAuth';
import { writeAdminAuditEvent } from '@/lib/adminAudit';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function isAdmin(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Seller review is not configured.' }, { status: 503 });

  const { data: applications, error } = await supabase.from('seller_applications')
    .select('id, user_id, seller_profile_id, display_name, university, campus, description, contact_options, status, review_notes, submitted_at, reviewed_at')
    .order('submitted_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load seller applications.' }, { status: 500 });

  const profileIds = [...new Set((applications || []).map((application) => application.seller_profile_id).filter((id): id is string => Boolean(id)))];
  const { data: profiles, error: profilesError } = profileIds.length
    ? await supabase.from('seller_profiles').select('id, status').in('id', profileIds)
    : { data: [], error: null };
  if (profilesError) return NextResponse.json({ error: 'Could not load seller account statuses.' }, { status: 500 });
  const statuses = new Map((profiles || []).map((profile) => [profile.id, profile.status]));

  return NextResponse.json({ applications: (applications || []).map((application) => ({
    id: application.id,
    sellerProfileId: application.seller_profile_id,
    applicantReference: application.user_id.slice(0, 8),
    displayName: application.display_name,
    university: application.university,
    campus: application.campus,
    description: application.description,
    contactOptions: application.contact_options,
    status: application.status,
    sellerStatus: application.seller_profile_id ? statuses.get(application.seller_profile_id) || 'inactive' : 'inactive',
    reviewNotes: application.review_notes,
    submittedAt: application.submitted_at,
    reviewedAt: application.reviewed_at,
  })) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Seller review is not configured.' }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid body');
    body = value as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Enter a valid seller action.' }, { status: 400 });
  }
  const action = typeof body.action === 'string' ? body.action : '';
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  if (!id || id.length > 120) return NextResponse.json({ error: 'A valid seller record is required.' }, { status: 400 });

  if (action === 'approve' || action === 'reject') {
    const notes = typeof body.reviewNotes === 'string' ? body.reviewNotes.trim() : '';
    if (notes.length > 2000) return NextResponse.json({ error: 'Review notes must be under 2,000 characters.' }, { status: 400 });
    const { data, error } = await supabase.rpc('review_seller_application', {
      p_application_id: id,
      p_decision: action === 'approve' ? 'approved' : 'rejected',
      p_review_notes: notes,
      p_reviewed_by: process.env.ADMIN_USERNAME || 'admin',
    });
    if (error) {
      if (error.code === 'P0002') return NextResponse.json({ error: 'This application is no longer pending.' }, { status: 409 });
      console.error('Seller application review failed', { code: error.code });
      return NextResponse.json({ error: 'Could not update this application.' }, { status: 500 });
    }
    const result = data as { seller_profile_id?: string; status?: string } | null;
    await writeAdminAuditEvent(request, { action: `seller.application.${action}`, resourceType: 'seller_application', resourceId: id, metadata: { status: result?.status || action } });
    return NextResponse.json({ ok: true, result }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (action !== 'suspend' && action !== 'reactivate') return NextResponse.json({ error: 'Choose approve, reject, suspend, or reactivate.' }, { status: 400 });
  const expectedStatus = action === 'suspend' ? 'approved' : 'suspended';
  const nextStatus = action === 'suspend' ? 'suspended' : 'approved';
  const { data, error } = await supabase.from('seller_profiles')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', id).eq('status', expectedStatus)
    .select('id, status').maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not update this seller account.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Seller status changed. Refresh and try again.' }, { status: 409 });
  await writeAdminAuditEvent(request, { action: `seller.account.${action}`, resourceType: 'seller_profile', resourceId: id, metadata: { status: nextStatus } });
  return NextResponse.json({ ok: true, profile: data }, { headers: { 'Cache-Control': 'no-store' } });
}
