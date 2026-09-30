import { NextRequest, NextResponse } from 'next/server';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function validToken(token: unknown): token is string {
  return typeof token === 'string' && /^[0-9a-f-]{36}$/i.test(token);
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Group buying is not configured yet.' }, { status: 503 });
  let body: { productId?: string; participantToken?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid group-buy request.' }, { status: 400 }); }
  const product = MOCK_PRODUCTS.find((item) => item.id === body.productId && item.stockStatus !== 'Coming Soon');
  if (!product || !validToken(body.participantToken)) return NextResponse.json({ error: 'Choose an active product.' }, { status: 400 });

  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from('group_buys').insert({
    id,
    product_id: product.id,
    product_title: product.title,
    retail_price: product.priceRetail,
    wholesale_price: product.priceWholesale,
    minimum_quantity: product.minWholesaleQty || 3,
    participant_count: 1,
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
  });
  if (error) return NextResponse.json({ error: 'Could not create this group buy.' }, { status: 500 });
  const { error: participantError } = await supabase.from('group_buy_participants').insert({ group_id: id, participant_token: body.participantToken });
  if (participantError) return NextResponse.json({ error: 'Could not start the group buy.' }, { status: 500 });

  return NextResponse.json({ id, productId: product.id, productTitle: product.title, retailPrice: product.priceRetail, wholesalePrice: product.priceWholesale, minimumQuantity: product.minWholesaleQty || 3, participantCount: 1, expiresAt }, { status: 201 });
}
