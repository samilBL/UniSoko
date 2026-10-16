import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Seller profiles are temporarily unavailable.' }, { status: 503 });
  const { data: profile, error } = await db.from('seller_profiles')
    .select('id,display_name,university,campus,description,avatar_url,status,created_at,contact_options')
    .eq('id', id).eq('status', 'approved').maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not load this seller.' }, { status: 500 });
  if (!profile) return NextResponse.json({ error: 'Seller not found.' }, { status: 404 });
  const [{ data: verification }, { count: productCount }] = await Promise.all([
    db.from('seller_verifications').select('status,verification_level,public_label,verified_at').eq('seller_profile_id', id).maybeSingle(),
    db.from('products').select('id', { count: 'exact', head: true }).eq('seller_profile_id', id).eq('listing_status', 'approved').eq('is_active', true),
  ]);
  const { contact_options, ...publicProfile } = profile;
  const contacts = contact_options && typeof contact_options === 'object' ? contact_options as Record<string, unknown> : {};
  const verified = verification?.status === 'verified';
  const verificationLabel = verified ? verification.verification_level === 'gold_tick' ? 'Gold Tick' : 'White Tick' : null;
  return NextResponse.json({ seller: {
    ...publicProfile,
    verified,
    verificationLabel,
    whatsappPhone: typeof contacts.phone === 'string' ? contacts.phone : null,
    tillNetwork: typeof contacts.tillNetwork === 'string' ? contacts.tillNetwork : null,
    tillNumber: typeof contacts.tillNumber === 'string' ? contacts.tillNumber : null,
    tillAccountName: typeof contacts.tillAccountName === 'string' ? contacts.tillAccountName : null,
    productCount: productCount || 0,
  } }, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } });
}
