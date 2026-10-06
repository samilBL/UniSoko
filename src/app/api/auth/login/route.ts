import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { allowPortalAuthAttempt } from '@/lib/portalRateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const admin = getSupabaseAdmin();
  const auth = await getSupabaseServer();
  if (!admin || !auth) return NextResponse.json({ error: 'Account service is not configured. Please contact UniSoko support.' }, { status: 503 });
  const rateLimit = await allowPortalAuthAttempt(request, admin, 'login', 15);
  if (rateLimit === 'unavailable') return NextResponse.json({ error: 'Account protection is not configured. Apply the password portal migration and try again.' }, { status: 503 });
  if (rateLimit === 'limited') return NextResponse.json({ error: 'Too many sign-in attempts. Wait 15 minutes and try again.' }, { status: 429, headers: { 'Retry-After': '900' } });

  let body: { identifier?: unknown; password?: unknown; portal?: unknown };
  try { body = await request.json() as { identifier?: unknown; password?: unknown; portal?: unknown }; }
  catch { return NextResponse.json({ error: 'Enter your email or phone and password.' }, { status: 400 }); }

  const identifier = typeof body.identifier === 'string' ? body.identifier.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const portal = body.portal === 'winga' || body.portal === 'seller' ? body.portal : null;
  if (!identifier || identifier.length > 254 || !password || password.length > 128 || !portal) {
    return NextResponse.json({ error: 'Enter your email or phone and password.' }, { status: 400 });
  }

  let email = identifier.toLowerCase();
  if (!identifier.includes('@')) {
    const digits = identifier.replace(/\D/g, '');
    const phone = digits.startsWith('0') ? `+255${digits.slice(1)}` : digits.startsWith('255') ? `+${digits}` : `+255${digits}`;
    if (/^\+255[678]\d{8}$/.test(phone)) {
      const { data } = await admin.from('account_directory').select('email').eq('phone', phone).maybeSingle();
      if (data?.email) email = data.email;
    }
  }

  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  if (error || !data.user) return NextResponse.json({ error: 'Email/phone or password is incorrect.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });

  const [{ data: winga, error: wingaError }, { data: seller, error: sellerError }] = await Promise.all([
    admin.from('winga_applications').select('status').eq('user_id', data.user.id).maybeSingle(),
    admin.from('seller_profiles').select('status').eq('user_id', data.user.id).maybeSingle(),
  ]);
  if (wingaError || sellerError) {
    await auth.auth.signOut();
    return NextResponse.json({ error: 'Could not verify your portal access. Please try again later.' }, { status: 503 });
  }
  if (portal === 'winga' && !winga) {
    await auth.auth.signOut();
    return NextResponse.json({ error: 'This account has no Winga application. Create a Winga account first.' }, { status: 403 });
  }
  if (portal === 'seller' && !seller) {
    await auth.auth.signOut();
    return NextResponse.json({ error: 'This account has no seller application. Create a seller account first.' }, { status: 403 });
  }
  const destination = portal === 'winga' ? '/winga/dashboard' : '/seller/dashboard';
  return NextResponse.json({ ok: true, destination, roles: { winga: winga?.status || null, seller: seller?.status || null } }, { headers: { 'Cache-Control': 'no-store' } });
}
