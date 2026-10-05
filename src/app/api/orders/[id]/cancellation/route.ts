import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const CANCELLATION_REASONS = new Set(['Changed mind', 'Ordered by mistake', 'Found another product', 'Delivery taking too long', 'Other']);

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Cancellation requests are not configured.' }, { status: 503 });
  let body: { token?: string; reason?: string; details?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid cancellation request.' }, { status: 400 }); }
  if (typeof body.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(body.token) || !CANCELLATION_REASONS.has(body.reason || '') ||
      (body.details !== undefined && (typeof body.details !== 'string' || body.details.length > 1_000))) {
    return NextResponse.json({ error: 'Provide a valid tracking token, cancellation reason, and optional note under 1,000 characters.' }, { status: 400 });
  }
  const { id } = await context.params;
  const tokenHash = createHash('sha256').update(body.token).digest('hex');
  const { data, error } = await supabase.rpc('request_order_cancellation', {
    target_order_id: id,
    supplied_token_hash: tokenHash,
    cancellation_reason: body.reason,
    cancellation_details: body.details?.trim() || '',
  });
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A cancellation request already exists for this order.' }, { status: 409 });
    if (error.message.includes('invalid order access')) return NextResponse.json({ error: 'This tracking link is invalid.' }, { status: 404 });
    if (error.message.includes('no longer eligible')) return NextResponse.json({ error: 'This order can no longer be cancelled online. Contact support.' }, { status: 409 });
    if (error.message.includes('invalid cancellation reason')) return NextResponse.json({ error: 'Choose a listed cancellation reason.' }, { status: 400 });
    return NextResponse.json({ error: 'Could not submit cancellation request.' }, { status: 500 });
  }
  return NextResponse.json({ request: { id: data.id, status: data.status, requestedAt: data.requested_at } }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
