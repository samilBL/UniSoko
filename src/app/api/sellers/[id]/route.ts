import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Seller profiles are temporarily unavailable.' }, { status: 503 });
  const { data: profile, error } = await db.from('seller_profiles')
    .select('id,display_name,university,campus,description,avatar_url,status,created_at')
    .eq('id', id).eq('status', 'approved').maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not load this seller.' }, { status: 500 });
  if (!profile) return NextResponse.json({ error: 'Seller not found.' }, { status: 404 });
  const [{ data: verification }, { count: productCount }] = await Promise.all([
    db.from('seller_verifications').select('status,verification_level,public_label,verified_at').eq('seller_profile_id', id).maybeSingle(),
    db.from('products').select('id', { count: 'exact', head: true }).eq('seller_profile_id', id).eq('listing_status', 'approved').eq('is_active', true),
  ]);
  return NextResponse.json({ seller: { ...profile, verified: verification?.status === 'verified', verificationLabel: verification?.status === 'verified' ? verification.public_label || 'Verified seller' : null, productCount: productCount || 0 } }, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } });
}
