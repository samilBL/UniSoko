import { NextRequest, NextResponse } from 'next/server';
import { getSellerActor, getSellerProfile } from '@/lib/sellerAuth';

export const dynamic = 'force-dynamic';

function readText(value: unknown, min: number, max: number) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length >= min && text.length <= max ? text : null;
}

export async function GET() {
  const actor = await getSellerActor();
  if (actor.kind === 'unavailable') return NextResponse.json({ error: 'Seller accounts are not configured.' }, { status: 503 });
  if (actor.kind !== 'ok') return NextResponse.json({ error: 'Sign in with your verified UniSoko account.' }, { status: 401 });

  const [{ data: profile, error: profileError }, { data: applications, error: applicationError }, { data: verification, error: verificationError }] = await Promise.all([
    getSellerProfile(actor.serviceClient, actor.user.id),
    actor.serviceClient.from('seller_applications')
      .select('id, status, review_notes, submitted_at, reviewed_at')
      .eq('user_id', actor.user.id)
      .order('submitted_at', { ascending: false })
      .limit(1),
    actor.serviceClient.from('seller_profiles').select('id').eq('user_id', actor.user.id).maybeSingle()
      .then(async ({ data, error }) => {
        if (error || !data) return { data: null, error };
        return actor.serviceClient.from('seller_verifications')
          .select('status, verification_level, public_label')
          .eq('seller_profile_id', data.id).maybeSingle();
      }),
  ]);
  if (profileError || applicationError || verificationError) return NextResponse.json({ error: 'Could not load your seller account.' }, { status: 500 });

  return NextResponse.json({
    email: actor.user.email,
    profile,
    application: applications?.[0] || null,
    verification: verification || { status: 'unverified', verification_level: 'none', public_label: null },
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const actor = await getSellerActor();
  if (actor.kind === 'unavailable') return NextResponse.json({ error: 'Seller accounts are not configured.' }, { status: 503 });
  if (actor.kind !== 'ok') return NextResponse.json({ error: 'Sign in with a verified UniSoko account before applying.' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid body');
    body = value as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Enter valid seller application details.' }, { status: 400 });
  }

  const displayName = readText(body.displayName, 2, 120);
  const university = readText(body.university, 2, 160);
  const campus = body.campus === '' || body.campus === undefined ? '' : readText(body.campus, 2, 160);
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  if (!displayName || !university || campus === null || description.length > 2000 || phone.length > 32) {
    return NextResponse.json({ error: 'Check your seller name, university, campus, description, and contact number.' }, { status: 400 });
  }
  if (phone && !/^\+?[0-9 ()-]{7,32}$/.test(phone)) {
    return NextResponse.json({ error: 'Enter a valid phone number or leave it blank.' }, { status: 400 });
  }

  const { data: existing, error: lookupError } = await getSellerProfile(actor.serviceClient, actor.user.id);
  if (lookupError) return NextResponse.json({ error: 'Could not check your seller account.' }, { status: 500 });
  if (existing && ['approved', 'suspended'].includes(existing.status)) {
    return NextResponse.json({ error: existing.status === 'approved' ? 'Your seller account is already approved.' : 'Your seller account is suspended. Contact support for help.' }, { status: 409 });
  }

  const contactOptions = {
    ...(actor.user.email ? { email: actor.user.email.toLowerCase() } : {}),
    ...(phone ? { phone } : {}),
  };
  const { data, error } = await actor.serviceClient.rpc('submit_seller_application', {
    p_user_id: actor.user.id,
    p_display_name: displayName,
    p_university: university,
    p_campus: campus || null,
    p_description: description,
    p_contact_options: contactOptions,
  });
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'An application is already being reviewed. Refresh to see its status.' }, { status: 409 });
    if (error.code === '23514') return NextResponse.json({ error: 'Your seller account cannot submit another application.' }, { status: 409 });
    console.error('Seller application submission failed', { code: error.code });
    return NextResponse.json({ error: 'Could not submit your application. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, application: data }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  const actor = await getSellerActor();
  if (actor.kind === 'unavailable') return NextResponse.json({ error: 'Seller accounts are not configured.' }, { status: 503 });
  if (actor.kind !== 'ok') return NextResponse.json({ error: 'Sign in with your verified UniSoko account.' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid body');
    body = value as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Enter valid profile details.' }, { status: 400 });
  }

  const displayName = readText(body.displayName, 2, 120);
  const university = readText(body.university, 2, 160);
  const campus = body.campus === '' || body.campus === undefined ? null : readText(body.campus, 2, 160);
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  if (!displayName || !university || (campus !== null && !campus) || description.length > 2000 || phone.length > 32 || (phone && !/^\+?[0-9 ()-]{7,32}$/.test(phone))) {
    return NextResponse.json({ error: 'Check the profile fields and try again.' }, { status: 400 });
  }

  const { data: profile, error: lookupError } = await getSellerProfile(actor.serviceClient, actor.user.id);
  if (lookupError) return NextResponse.json({ error: 'Could not load your seller profile.' }, { status: 500 });
  if (!profile) return NextResponse.json({ error: 'Submit a seller application before editing a profile.' }, { status: 404 });
  if (profile.status !== 'approved') return NextResponse.json({ error: 'Only approved sellers can edit their public profile.' }, { status: 403 });

  const contactOptions = {
    ...(actor.user.email ? { email: actor.user.email.toLowerCase() } : {}),
    ...(phone ? { phone } : {}),
  };
  const { data, error } = await actor.serviceClient.from('seller_profiles')
    .update({ display_name: displayName, university, campus, description, contact_options: contactOptions, updated_at: new Date().toISOString() })
    .eq('id', profile.id)
    .eq('user_id', actor.user.id)
    .eq('status', 'approved')
    .select('id, display_name, university, campus, description, contact_options, status, updated_at')
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not save your seller profile.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Your seller account status changed. Refresh and try again.' }, { status: 409 });
  return NextResponse.json({ profile: data }, { headers: { 'Cache-Control': 'no-store' } });
}
