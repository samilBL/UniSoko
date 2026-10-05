import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const SUCCESSFUL_STATUSES = new Set(['Approved', 'Out for Delivery', 'Completed']);

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ wingas: [], configured: false });

  const { data: applications, error } = await supabase.from('winga_applications')
    .select('id, full_name, university, promo_code, submitted_at, reviewed_at, student_id_verified')
    .eq('status', 'Approved')
    .not('promo_code', 'is', null);
  if (error) return NextResponse.json({ error: 'Could not load the Winga leaderboard.' }, { status: 500 });

  const promoCodes = (applications || []).map((application) => application.promo_code).filter((code): code is string => Boolean(code));
  const { data: orders, error: ordersError } = promoCodes.length
    ? await supabase.from('orders').select('winga_code_used, quantity, status, payment_status').in('winga_code_used', promoCodes)
    : { data: [], error: null };
  if (ordersError) return NextResponse.json({ error: 'Could not load leaderboard order totals.' }, { status: 500 });

  const wingas = (applications || []).map((application) => {
    const successfulOrders = (orders || []).filter((order) => order.winga_code_used === application.promo_code
      && (order.payment_status === 'Verified' || SUCCESSFUL_STATUSES.has(order.status)));
    return {
      id: application.id,
      fullName: application.full_name,
      university: application.university,
      joinedAt: application.reviewed_at || application.submitted_at,
      studentIdVerified: application.student_id_verified,
      successfulPurchases: successfulOrders.length,
      productsSold: successfulOrders.reduce((total, order) => total + Number(order.quantity || 0), 0),
    };
  }).sort((left, right) => right.productsSold - left.productsSold || right.successfulPurchases - left.successfulPurchases);

  return NextResponse.json({ wingas, configured: true }, { headers: { 'Cache-Control': 'no-store' } });
}
