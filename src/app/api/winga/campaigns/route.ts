import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await getSupabaseServer();
  const db = getSupabaseAdmin();
  if (!auth || !db) return NextResponse.json({ error: 'Winga earnings are not configured.' }, { status: 503 });
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sign in to the Winga portal.' }, { status: 401 });
  const { data: profile, error: profileError } = await db.from('winga_applications').select('id,status,promo_code').eq('user_id', user.id).maybeSingle();
  if (profileError) return NextResponse.json({ error: 'Could not load Winga profile.' }, { status: 503 });
  if (!profile || profile.status !== 'Approved' || !profile.promo_code) return NextResponse.json({ error: 'Approved Winga access is required.' }, { status: 403 });
  const [{ data: products, error: productError }, { data: commissions, error: commissionError }] = await Promise.all([
    db.from('products').select('id,name,price,seller_winga_commission_rate,seller_profile_id,seller_profiles!inner(display_name,status)').eq('seller_winga_campaign_enabled', true).eq('listing_status', 'approved').eq('is_active', true).eq('in_stock', true).order('created_at', { ascending: false }).limit(100),
    db.from('winga_commissions').select('id,product_title,product_id,seller_profile_id,commission_rate,commission_base,amount,status,created_at').eq('winga_application_id', profile.id).order('created_at', { ascending: false }).limit(100),
  ]);
  if (productError || commissionError) return NextResponse.json({ error: 'Could not load Winga campaigns. Apply the latest marketplace migration.' }, { status: 503 });
  const campaigns = (products || []).filter((product) => {
    const seller = Array.isArray(product.seller_profiles) ? product.seller_profiles[0] : product.seller_profiles;
    return seller?.status === 'approved';
  }).map((product) => {
    const seller = Array.isArray(product.seller_profiles) ? product.seller_profiles[0] : product.seller_profiles;
    return { id: product.id, name: product.name, price: Number(product.price), sellerName: seller?.display_name || 'Marketplace seller', commissionRate: Number(product.seller_winga_commission_rate), shareUrl: `/product/${encodeURIComponent(product.id)}?ref=${encodeURIComponent(profile.promo_code!)}` };
  });
  const earnings = (commissions || []).reduce((summary, row) => {
    const amount = Number(row.amount);
    summary.total += amount;
    if (row.status === 'payable') summary.payable += amount;
    if (row.status === 'paid') summary.paid += amount;
    if (row.status === 'pending') summary.pending += amount;
    return summary;
  }, { total: 0, payable: 0, pending: 0, paid: 0 });
  return NextResponse.json({ promoCode: profile.promo_code, campaigns, earnings, commissions: commissions || [] }, { headers: { 'Cache-Control': 'no-store' } });
}
