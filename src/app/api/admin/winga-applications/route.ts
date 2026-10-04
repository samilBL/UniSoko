import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { writeAdminAuditEvent } from '@/lib/adminAudit';

const ID_BUCKET = 'winga-student-ids';
const ID_URL_TTL_SECONDS = 15 * 60;

function isAdmin(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

async function presentApplication(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>, row: {
  id: string; user_id: string; email: string; full_name: string; phone: string; university: string;
  status: string; promo_code: string | null; submitted_at: string; reviewed_at: string | null;
  student_id_verified: boolean; student_id_card_path: string | null;
}) {
  let studentIdCardUrl: string | undefined;
  if (row.student_id_card_path) {
    const { data, error } = await supabase.storage.from(ID_BUCKET).createSignedUrl(row.student_id_card_path, ID_URL_TTL_SECONDS);
    if (error) throw new Error('Could not create a private student ID review link.');
    studentIdCardUrl = data.signedUrl;
  }
  return {
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
    studentIdCardUrl,
  };
}

const APPLICATION_COLUMNS = 'id, user_id, email, full_name, phone, university, status, promo_code, submitted_at, reviewed_at, student_id_verified, student_id_card_path';

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ applications: [], configured: false });
  const { data, error } = await supabase.from('winga_applications').select(APPLICATION_COLUMNS).order('submitted_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load Winga applications.' }, { status: 500 });
  try {
    const applications = await Promise.all((data || []).map((row) => presentApplication(supabase, row)));
    return NextResponse.json({ applications, configured: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not prepare private student ID review links.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Winga applications are not configured.' }, { status: 503 });

  let body: { id?: string; status?: string; studentIdVerified?: boolean };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid review request.' }, { status: 400 }); }

  if (body.id && typeof body.studentIdVerified === 'boolean') {
    const { data: existing, error: lookupError } = await supabase.from('winga_applications')
      .select('id, student_id_card_path')
      .eq('id', body.id)
      .maybeSingle();
    if (lookupError) return NextResponse.json({ error: 'Could not load this Winga application.' }, { status: 500 });
    if (!existing?.student_id_card_path) return NextResponse.json({ error: 'The applicant must upload a student ID before it can be verified.' }, { status: 409 });

    const { data, error } = await supabase.from('winga_applications')
      .update({ student_id_verified: body.studentIdVerified, updated_at: new Date().toISOString() })
      .eq('id', body.id)
      .select(APPLICATION_COLUMNS)
      .maybeSingle();
    if (error) return NextResponse.json({ error: 'Could not update student ID verification.' }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'This Winga application no longer exists.' }, { status: 404 });
    await writeAdminAuditEvent(request, { action: 'winga.student_id_verification', resourceType: 'winga_application', resourceId: body.id, metadata: { verified: body.studentIdVerified } });
    try {
      return NextResponse.json({ application: await presentApplication(supabase, data) }, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
      return NextResponse.json({ error: 'Verification was saved, but the private ID review link could not be refreshed.' }, { status: 500 });
    }
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
      .select(APPLICATION_COLUMNS)
      .maybeSingle();

    if (!error && data) {
      await writeAdminAuditEvent(request, { action: `winga.application.${body.status?.toLowerCase()}`, resourceType: 'winga_application', resourceId: data.id, metadata: { status: data.status } });
      try {
        return NextResponse.json({ application: await presentApplication(supabase, data) }, { headers: { 'Cache-Control': 'no-store' } });
      } catch {
        return NextResponse.json({ error: 'Review was saved, but the private ID review link could not be refreshed.' }, { status: 500 });
      }
    }
    if (error?.code === '23505' && body.status === 'Approved') continue;
    if (error) return NextResponse.json({ error: 'Could not update the application.' }, { status: 500 });
    return NextResponse.json({ error: 'This application is no longer pending.' }, { status: 409 });
  }
  return NextResponse.json({ error: 'Could not generate a unique Winga code. Retry approval.' }, { status: 503 });
}
