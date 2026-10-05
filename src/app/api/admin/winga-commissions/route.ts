import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/adminAuth';
import { writeAdminAuditEvent } from '@/lib/adminAudit';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
function allowed(request: NextRequest) { return isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value); }

export async function GET(request: NextRequest) {
  if (!allowed(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Winga commission accounting is not configured.' }, { status: 503 });
  const { data, error } = await db.from('winga_commissions').select('id,winga_application_id,seller_profile_id,order_id,product_title,commission_rate,commission_base,amount,status,payout_reference,created_at,paid_at,winga_applications!inner(full_name,email,promo_code),seller_profiles(display_name)').order('created_at', { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: 'Could not load commission records. Apply the seller commission migration.' }, { status: 503 });
  return NextResponse.json({ commissions: (data || []).map((row) => ({ ...row, winga: Array.isArray(row.winga_applications) ? row.winga_applications[0] : row.winga_applications, seller: Array.isArray(row.seller_profiles) ? row.seller_profiles[0] : row.seller_profiles })) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  if (!allowed(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Winga commission accounting is not configured.' }, { status: 503 });
  let body: Record<string, unknown>;
  try { const value: unknown = await request.json(); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); body = value as Record<string, unknown>; }
  catch { return NextResponse.json({ error: 'Enter a valid payout update.' }, { status: 400 }); }
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const reference = typeof body.reference === 'string' ? body.reference.trim() : '';
  if (!id || !reference || reference.length > 160) return NextResponse.json({ error: 'Add the external mobile-money or bank payout reference.' }, { status: 400 });
  const { data, error } = await db.from('winga_commissions').update({ status: 'paid', payout_reference: reference, paid_at: new Date().toISOString() }).eq('id', id).eq('status', 'payable').select('id,amount').maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not mark this commission paid.' }, { status: 503 });
  if (!data) return NextResponse.json({ error: 'This commission is no longer payable.' }, { status: 409 });
  await writeAdminAuditEvent(request, { action: 'winga.commission.paid', resourceType: 'winga_commission', resourceId: id, metadata: { amount: Number(data.amount), reference } });
  return NextResponse.json({ ok: true });
}
