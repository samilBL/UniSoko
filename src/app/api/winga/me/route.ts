import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  const authClient = await getSupabaseServer();
  const serviceClient = getSupabaseAdmin();
  if (!authClient || !serviceClient) return NextResponse.json({ error: 'Winga access is not configured.' }, { status: 503 });

  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sign in to your Winga account.' }, { status: 401 });
  const { data, error } = await serviceClient
    .from('winga_applications')
    .select('id, full_name, phone, university, status, promo_code, submitted_at, reviewed_at, student_id_verified')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not load your Winga profile.' }, { status: 500 });
  if (!data) return NextResponse.json({ profile: null }, { headers: { 'Cache-Control': 'no-store' } });

  return NextResponse.json({
    profile: {
      id: data.id,
      fullName: data.full_name,
      phone: data.phone,
      university: data.university,
      status: data.status,
      promoCode: data.status === 'Approved' && data.student_id_verified ? data.promo_code : null,
      studentIdVerified: data.student_id_verified,
      submittedAt: data.submitted_at,
      reviewedAt: data.reviewed_at,
    },
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE() {
  const authClient = await getSupabaseServer();
  if (!authClient) return NextResponse.json({ error: 'Winga access is not configured.' }, { status: 503 });
  const { error } = await authClient.auth.signOut();
  if (error) return NextResponse.json({ error: 'Could not sign out.' }, { status: 500 });
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
