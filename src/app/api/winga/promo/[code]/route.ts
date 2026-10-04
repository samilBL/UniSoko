import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const WINGA_DISCOUNT = 5000;

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Promo codes are temporarily unavailable.' }, { status: 503 });

  const { code: encodedCode } = await context.params;
  const code = decodeURIComponent(encodedCode).trim().toUpperCase();
  if (!/^WINGA-[A-Z0-9]{3,12}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid promo code' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const { data, error } = await supabase
    .from('winga_applications')
    .select('student_id_verified')
    .eq('promo_code', code)
    .eq('status', 'Approved')
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Promo codes are temporarily unavailable. Try again.' }, { status: 503 });
  if (!data?.student_id_verified) {
    return NextResponse.json({ error: 'Invalid promo code' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json({ code, discountAmount: WINGA_DISCOUNT }, { headers: { 'Cache-Control': 'no-store' } });
}
