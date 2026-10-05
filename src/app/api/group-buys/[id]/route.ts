import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_PRODUCTS } from '@/lib/mockData';

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
  status: string;
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
    status: group.status || 'open',
  };
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Group buying is not configured yet.' }, { status: 503 });
  const { id } = await context.params;
  const { data, error } = await supabase.from('group_buys').select('*').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not load this group buy.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Group buy not found.' }, { status: 404 });
  const { data: participants } = await supabase.from('group_buy_participants').select('product_id, product_title, retail_price, wholesale_price').eq('group_id', id);
  return NextResponse.json({ group: { ...mapGroup(data as GroupBuyRow), products: participants || [] } }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Group buying is not configured yet.' }, { status: 503 });
  const { id } = await context.params;
  let body: { participantToken?: string; productId?: string; action?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid join request.' }, { status: 400 }); }
  if (typeof body.participantToken !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.participantToken)) {
    return NextResponse.json({ error: 'Invalid participant.' }, { status: 400 });
  }
  if (body.action === 'close') {
    const { data, error } = await supabase.rpc('close_group_buy', { target_group_id: id, closing_token: body.participantToken });
    if (error) return NextResponse.json({ error: error.message.includes('minimum') ? 'The group needs more members before it can be closed.' : 'Could not close this group buy.' }, { status: error.message.includes('minimum') ? 409 : 500 });
    const group = Array.isArray(data) ? data[0] : data;
    const { data: participants } = await supabase.from('group_buy_participants').select('product_id, product_title, retail_price, wholesale_price').eq('group_id', id);
    return NextResponse.json({ group: { ...mapGroup(group as GroupBuyRow), products: participants || [] } });
  }
  const product = MOCK_PRODUCTS.find((item) => item.id === body.productId && item.stockStatus !== 'Coming Soon');
  if (!product) return NextResponse.json({ error: 'Choose an available product to join.' }, { status: 400 });
  const { data, error } = await supabase.rpc('join_group_buy_with_product', {
    target_group_id: id, joining_token: body.participantToken, joining_product_id: product.id,
    joining_product_title: product.title, joining_retail_price: product.priceRetail, joining_wholesale_price: product.priceWholesale,
  });
  if (error) return NextResponse.json({ error: error.message.includes('expired') ? 'This group buy has expired.' : 'Could not join this group buy.' }, { status: error.message.includes('expired') ? 410 : 500 });
  const group = Array.isArray(data) ? data[0] : data;
  if (!group) return NextResponse.json({ error: 'Group buy not found.' }, { status: 404 });
  const { data: participants } = await supabase.from('group_buy_participants').select('product_id, product_title, retail_price, wholesale_price').eq('group_id', id);
  return NextResponse.json({ group: { ...mapGroup(group as GroupBuyRow), products: participants || [] } });
}
