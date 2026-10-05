import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function readString(value: unknown, maxLength: number) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength
    ? value.trim()
    : null;
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Winga account creation is not configured. Contact UniSoko support.' }, { status: 503 });

  let body: { email?: unknown; password?: unknown; fullName?: unknown; phone?: unknown; university?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Enter your account details and try again.' }, { status: 400 }); }

  const email = readString(body.email, 254)?.toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const fullName = readString(body.fullName, 120);
  const submittedPhone = readString(body.phone, 32);
  const university = readString(body.university, 160);
  const digits = submittedPhone?.replace(/\D/g, '') || '';
  const phone = submittedPhone?.startsWith('+') ? `+${digits}`
    : digits.startsWith('0') ? `+255${digits.slice(1)}`
      : digits.startsWith('255') ? `+${digits}` : `+255${digits}`;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 128 ||
      !fullName || fullName.length < 2 || !submittedPhone || !/^\+255[678]\d{8}$/.test(phone) || !university) {
    return NextResponse.json({ error: 'Enter a valid email, a password with at least 12 characters, your full name, Tanzanian phone number, and university.' }, { status: 400 });
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) {
    const isDuplicate = Boolean(error?.message.toLowerCase().includes('already') || error?.message.toLowerCase().includes('registered'));
    const serviceMessage = error?.message.replace(/\s+/g, ' ').slice(0, 220);
    return NextResponse.json({ error: isDuplicate
      ? 'A Winga account may already exist for this email. Sign in instead.'
      : serviceMessage ? `Could not create the account: ${serviceMessage}` : 'Account creation is temporarily unavailable. Please try again shortly.' }, {
      status: isDuplicate ? 409 : 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const { error: profileError } = await supabase.from('winga_applications').insert({
    user_id: data.user.id,
    email,
    full_name: fullName,
    phone,
    university,
    status: 'Pending',
    promo_code: null,
    student_id_verified: false,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ error: profileError.code === '23505'
      ? 'A Winga account already exists for this email. Sign in instead.'
      : profileError.code === '42703' || profileError.code === '42P01'
        ? 'Winga account storage needs its latest database migration. Please contact UniSoko support.'
        : `Could not save your Winga profile: ${profileError.message.replace(/\s+/g, ' ').slice(0, 180)}` }, { status: profileError.code === '23505' ? 409 : 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
