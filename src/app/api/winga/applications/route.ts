import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSupabaseServer } from '@/lib/supabaseServer';

function readString(value: unknown, maxLength: number) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength
    ? value.trim()
    : null;
}

export async function POST(request: NextRequest) {
  const authClient = await getSupabaseServer();
  const serviceClient = getSupabaseAdmin();
  if (!authClient || !serviceClient) return NextResponse.json({ error: 'Winga applications are not configured.' }, { status: 503 });

  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user?.email || !user.email_confirmed_at) return NextResponse.json({ error: 'Verify your email before applying.' }, { status: 401 });

  let body: { fullName?: unknown; phone?: unknown; university?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid application.' }, { status: 400 }); }
  const fullName = readString(body.fullName, 120);
  const submittedPhone = readString(body.phone, 32);
  const university = readString(body.university, 160);
  const digits = submittedPhone?.replace(/\D/g, '') || '';
  const phone = submittedPhone?.startsWith('+') ? `+${digits}`
    : digits.startsWith('0') ? `+255${digits.slice(1)}`
      : digits.startsWith('255') ? `+${digits}` : `+255${digits}`;
  if (!fullName || fullName.length < 2 || !submittedPhone || !/^\+255[678]\d{8}$/.test(phone) || !university) {
    return NextResponse.json({ error: 'Check your name, university, and Tanzanian mobile-money contact number.' }, { status: 400 });
  }

  const { data: existing, error: lookupError } = await serviceClient
    .from('winga_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: 'Could not check your application.' }, { status: 500 });
  if (existing?.status === 'Approved') return NextResponse.json({ error: 'Your Winga application is already approved.' }, { status: 409 });

  const application = {
    email: user.email.toLowerCase(),
    full_name: fullName,
    phone,
    university,
    status: 'Pending',
    promo_code: null,
    reviewed_at: null,
    updated_at: new Date().toISOString(),
  };
  if (existing) {
    const { data, error } = await serviceClient.from('winga_applications')
      .update(application)
      .eq('id', existing.id)
      .eq('status', existing.status)
      .select('id')
      .maybeSingle();
    if (error) return NextResponse.json({ error: 'Could not submit your application.' }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Your application status changed. Reload to view it.' }, { status: 409 });
  } else {
    const { error } = await serviceClient.from('winga_applications').insert({ ...application, user_id: user.id });
    if (error?.code === '23505') return NextResponse.json({ error: 'An application already exists for this account. Reload to view its status.' }, { status: 409 });
    if (error) return NextResponse.json({ error: 'Could not submit your application.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: 'Pending' }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}