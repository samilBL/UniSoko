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
  if (authError || !user?.phone) return NextResponse.json({ error: 'Verify your phone number before applying.' }, { status: 401 });

  let body: { fullName?: unknown; phone?: unknown; university?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid application.' }, { status: 400 }); }
  const fullName = readString(body.fullName, 120);
  const phone = readString(body.phone, 24);
  const university = readString(body.university, 160);
  if (!fullName || fullName.length < 2 || !phone || !university || phone !== user.phone) {
    return NextResponse.json({ error: 'Check your name, university, and verified phone number.' }, { status: 400 });
  }

  const { data: existing, error: lookupError } = await serviceClient
    .from('winga_applications')
    .select('status')
    .eq('user_id', user.id)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: 'Could not check your application.' }, { status: 500 });
  if (existing?.status === 'Approved') return NextResponse.json({ error: 'Your Winga application is already approved.' }, { status: 409 });

  const { error } = await serviceClient.from('winga_applications').upsert({
    user_id: user.id,
    full_name: fullName,
    phone: user.phone,
    university,
    status: 'Pending',
    promo_code: null,
    reviewed_by: null,
    reviewed_at: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) return NextResponse.json({ error: 'Could not submit your application.' }, { status: 500 });

  return NextResponse.json({ ok: true, status: 'Pending' }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}