import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { allowPortalAuthAttempt } from '@/lib/portalRateLimit';

export const dynamic = 'force-dynamic';

type Registration = {
  accountType?: unknown;
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  password?: unknown;
  university?: unknown;
  campus?: unknown;
  description?: unknown;
  displayName?: unknown;
};

function cleanText(value: unknown, min: number, max: number) {
  if (typeof value !== 'string') return null;
  const result = value.trim();
  return result.length >= min && result.length <= max ? result : null;
}

function normalizeTanzanianPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  const normalized = digits.startsWith('0') ? `+255${digits.slice(1)}` : digits.startsWith('255') ? `+${digits}` : `+255${digits}`;
  return /^\+255[678]\d{8}$/.test(normalized) ? normalized : null;
}

export async function POST(request: NextRequest) {
  const admin = getSupabaseAdmin();
  const sessionClient = await getSupabaseServer();
  if (!admin || !sessionClient) return NextResponse.json({ error: 'Account service is not configured. Please contact UniSoko support.' }, { status: 503 });
  const rateLimit = await allowPortalAuthAttempt(request, admin, 'register', 5);
  if (rateLimit === 'unavailable') return NextResponse.json({ error: 'Account protection is not configured. Apply the password portal migration and try again.' }, { status: 503 });
  if (rateLimit === 'limited') return NextResponse.json({ error: 'Too many account attempts. Wait 15 minutes and try again.' }, { status: 429, headers: { 'Retry-After': '900' } });

  let body: Registration;
  try {
    body = await request.json() as Registration;
  } catch {
    return NextResponse.json({ error: 'Enter valid account details.' }, { status: 400 });
  }

  const accountType = body.accountType === 'winga' || body.accountType === 'seller' ? body.accountType : null;
  const fullName = cleanText(body.fullName, 2, 120);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phoneInput = cleanText(body.phone, 7, 32);
  const phone = phoneInput ? normalizeTanzanianPhone(phoneInput) : null;
  const password = typeof body.password === 'string' ? body.password : '';
  const university = cleanText(body.university, 2, 160);
  const displayName = cleanText(body.displayName, 2, 120);
  const campus = body.campus === undefined || body.campus === '' ? null : cleanText(body.campus, 2, 160);
  const description = typeof body.description === 'string' ? body.description.trim() : '';

  if (!accountType || !fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !phone || password.length < 8 || password.length > 128 || !university || (accountType === 'seller' && !displayName) || (body.campus && !campus) || description.length > 2000) {
    return NextResponse.json({ error: 'Check your name, email, Tanzanian phone, password (at least 8 characters), university, and portal details.' }, { status: 400 });
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone, university, account_type: accountType },
  });
  if (createError || !created.user) {
    if (createError?.message.toLowerCase().includes('already')) return NextResponse.json({ error: 'An account already exists for that email. Sign in or use password recovery.' }, { status: 409 });
    console.error('Portal account creation failed', { code: createError?.status || 'unknown' });
    return NextResponse.json({ error: 'Could not create your account. Check the details or contact UniSoko support.' }, { status: 503 });
  }

  const userId = created.user.id;
  const { error: directoryError } = await admin.from('account_directory').insert({ user_id: userId, email, phone, full_name: fullName });
  if (directoryError) {
    await admin.auth.admin.deleteUser(userId);
    if (directoryError.code === '23505') return NextResponse.json({ error: 'That phone number is already linked to an account.' }, { status: 409 });
    console.error('Portal account directory write failed', { code: directoryError.code });
    return NextResponse.json({ error: 'Could not finish account setup. Please try again.' }, { status: 503 });
  }

  let applicationError: { code?: string; message?: string } | null = null;
  if (accountType === 'winga') {
    const { error } = await admin.from('winga_applications').insert({
      user_id: userId, email, full_name: fullName, phone, university,
      status: 'Pending', promo_code: null,
    });
    applicationError = error;
  } else {
    const contactOptions = { email, phone };
    const { error } = await admin.rpc('submit_seller_application', {
      p_user_id: userId,
      p_display_name: displayName,
      p_university: university,
      p_campus: campus,
      p_description: description,
      p_contact_options: contactOptions,
    });
    applicationError = error;
  }

  if (applicationError) {
    await admin.from('account_directory').delete().eq('user_id', userId);
    await admin.auth.admin.deleteUser(userId);
    console.error('Portal application creation failed', { code: applicationError.code || 'unknown' });
    return NextResponse.json({ error: 'Your account could not be connected to an application. Please retry or contact UniSoko support.' }, { status: 503 });
  }

  const { error: signInError } = await sessionClient.auth.signInWithPassword({ email, password });
  if (signInError) {
    return NextResponse.json({ ok: true, accountType, needsLogin: true, status: 'Pending' }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json({ ok: true, accountType, status: 'Pending', destination: accountType === 'winga' ? '/winga/dashboard' : '/seller/dashboard' }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
