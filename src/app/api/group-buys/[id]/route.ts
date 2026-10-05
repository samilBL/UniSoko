import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

interface GroupBuyRow {
  id: string;
  product_id: string;
  product_title: string;
  retail_price: number;
  wholesale_price: number;
  minimum_quantity: number;
  participant_count: number;
  created_at: string;
  expires_at: string;
}

function mapGroup(group: GroupBuyRow) {
  return {
    id: group.id,
    productId: group.product_id,
    productTitle: group.product_title,
    retailPrice: Number(group.retail_price),
    wholesalePrice: Number(group.wholesale_price),
    minimumQuantity: Number(group.minimum_quantity),
    participantCount: Number(group.participant_count),
    createdAt: group.created_at,
    expiresAt: group.expires_at,
  };
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Group buying is not configured yet.' }, { status: 503 });
  const { id } = await context.params;
  const { data, error } = await supabase.from('group_buys').select('*').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not load this group buy.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Group buy not found.' }, { status: 404 });
  if (data.seller_profile_id) {
    const [{ data: seller }, { data: product }] = await Promise.all([
      supabase.from('seller_profiles').select('status').eq('id', data.seller_profile_id).maybeSingle(),
      supabase.from('products').select('id').eq('id', data.product_id).eq('seller_profile_id', data.seller_profile_id).eq('listing_status', 'approved').eq('is_active', true).eq('seller_group_buy_enabled', true).maybeSingle(),
    ]);
    if (seller?.status !== 'approved' || !product) return NextResponse.json({ error: 'This seller group buy is no longer available.' }, { status: 410 });
  }
  return NextResponse.json({ group: mapGroup(data as GroupBuyRow) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Group buying is not configured yet.' }, { status: 503 });
  const { id } = await context.params;
  let body: { participantToken?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid join request.' }, { status: 400 }); }
  if (typeof body.participantToken !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.participantToken)) {
    return NextResponse.json({ error: 'Invalid participant.' }, { status: 400 });
  }
  const { data: currentGroup, error: groupError } = await supabase.from('group_buys').select('id,expires_at,status').eq('id', id).maybeSingle();
  if (groupError) return NextResponse.json({ error: 'Could not check this group buy.' }, { status: 503 });
  if (!currentGroup) return NextResponse.json({ error: 'Group buy not found.' }, { status: 404 });
  if (currentGroup.status === 'closed') return NextResponse.json({ error: 'This group buy is closed.' }, { status: 409 });
  if (new Date(currentGroup.expires_at).getTime() <= Date.now()) return NextResponse.json({ error: 'This group buy has expired.' }, { status: 410 });
  const { data, error } = await supabase.rpc('join_group_buy', { target_group_id: id, joining_token: body.participantToken });
  if (error) return NextResponse.json({ error: error.message.includes('expired') ? 'This group buy has expired.' : 'Could not join this group buy.' }, { status: error.message.includes('expired') ? 410 : error.message.includes('closed') ? 409 : 500 });
  const group = Array.isArray(data) ? data[0] : data;
  if (!group) return NextResponse.json({ error: 'Group buy not found.' }, { status: 404 });
  return NextResponse.json({ group: mapGroup(group as GroupBuyRow) });
}
