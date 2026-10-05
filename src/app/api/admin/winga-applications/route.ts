import { randomBytes } from 'node:crypto';
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
  if (!supabase) return NextResponse.json({ applications: [], configured: false });
  const { data, error } = await supabase.from('winga_applications').select('id, user_id, email, full_name, phone, university, status, promo_code, submitted_at, reviewed_at, student_id_verified').order('submitted_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load Winga applications.' }, { status: 500 });
  const applications = (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    university: row.university,
    status: row.status,
    promoCode: row.promo_code || undefined,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at || undefined,
    studentIdVerified: row.student_id_verified,
  }));
  return NextResponse.json({ applications, configured: true }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Winga applications are not configured.' }, { status: 503 });

  let body: { id?: string; status?: string; studentIdVerified?: boolean };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid review request.' }, { status: 400 }); }
  if (body.id && typeof body.studentIdVerified === 'boolean') {
    const { data, error } = await supabase.from('winga_applications')
      .update({ student_id_verified: body.studentIdVerified, updated_at: new Date().toISOString() })
      .eq('id', body.id)
      .eq('status', 'Approved')
      .select('id, user_id, email, full_name, phone, university, status, promo_code, submitted_at, reviewed_at, student_id_verified')
      .maybeSingle();
    if (error) return NextResponse.json({ error: 'Could not update student ID verification.' }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Only approved Winga profiles can be verified.' }, { status: 409 });
    await writeAdminAuditEvent(request, { action: 'winga.student_id_verification', resourceType: 'winga_application', resourceId: body.id, metadata: { verified: body.studentIdVerified } });
    return NextResponse.json({ application: {
      id: data.id,
      userId: data.user_id,
      email: data.email,
      fullName: data.full_name,
      phone: data.phone,
      university: data.university,
      status: data.status,
      promoCode: data.promo_code || undefined,
      submittedAt: data.submitted_at,
      reviewedAt: data.reviewed_at || undefined,
      studentIdVerified: data.student_id_verified,
    } }, { headers: { 'Cache-Control': 'no-store' } });
  }
  if (!body.id || !['Approved', 'Rejected'].includes(body.status || '')) {
    return NextResponse.json({ error: 'Choose approval or rejection.' }, { status: 400 });
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const promoCode = body.status === 'Approved' ? `WINGA-${randomBytes(3).toString('hex').toUpperCase()}` : null;
    const { data, error } = await supabase.from('winga_applications')
      .update({ status: body.status, promo_code: promoCode, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', body.id)
      .eq('status', 'Pending')
      .select('id, user_id, email, full_name, phone, university, status, promo_code, submitted_at, reviewed_at, student_id_verified')
      .maybeSingle();

    if (!error && data) {
      await writeAdminAuditEvent(request, { action: `winga.application.${body.status?.toLowerCase()}`, resourceType: 'winga_application', resourceId: data.id, metadata: { status: data.status } });
      return NextResponse.json({ application: {
        id: data.id,
        userId: data.user_id,
        email: data.email,
        fullName: data.full_name,
        phone: data.phone,
        university: data.university,
        status: data.status,
        promoCode: data.promo_code || undefined,
        submittedAt: data.submitted_at,
        reviewedAt: data.reviewed_at || undefined,
        studentIdVerified: data.student_id_verified,
      } }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (error?.code === '23505' && body.status === 'Approved') continue;
    if (error) return NextResponse.json({ error: 'Could not update the application.' }, { status: 500 });
    return NextResponse.json({ error: 'This application is no longer pending.' }, { status: 409 });
  }
  return NextResponse.json({ error: 'Could not generate a unique Winga code. Retry approval.' }, { status: 503 });
}