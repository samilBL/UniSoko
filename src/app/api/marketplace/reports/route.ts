import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  const auth = await getSupabaseServer();
  const db = getSupabaseAdmin();
  if (!auth || !db) return NextResponse.json({ error: 'Reporting is temporarily unavailable.' }, { status: 503 });
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in before reporting a listing.' }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid body');
    body = value as Record<string, unknown>;
  } catch { return NextResponse.json({ error: 'Enter a valid report.' }, { status: 400 }); }
  const productId = typeof body.productId === 'string' ? body.productId.trim().slice(0, 120) : null;
  const sellerId = typeof body.sellerProfileId === 'string' ? body.sellerProfileId.trim() : null;
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 120) : '';
  const details = typeof body.details === 'string' ? body.details.trim() : '';
  if ((!productId && !sellerId) || reason.length < 2 || details.length > 2000) return NextResponse.json({ error: 'Choose a reason and provide valid report details.' }, { status: 400 });
  if (productId) {
    const { data } = await db.from('products').select('id,seller_profile_id').eq('id', productId).maybeSingle();
    if (!data) return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    if (sellerId && data.seller_profile_id !== sellerId) return NextResponse.json({ error: 'The seller does not match this listing.' }, { status: 400 });
  }
  if (sellerId) {
    const { data: seller } = await db.from('seller_profiles').select('id').eq('id', sellerId).eq('status', 'approved').maybeSingle();
    if (!seller) return NextResponse.json({ error: 'Seller not found.' }, { status: 404 });
  }
  const { error } = await db.from('marketplace_reports').insert({ reporter_user_id: user.id, product_id: productId, seller_profile_id: sellerId, reason, details });
  if (error) return NextResponse.json({ error: 'Could not submit your report.' }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
