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
  let productId = product?.id || '';
  let productTitle = product?.title || '';
  let retailPrice = product?.priceRetail || 0;
  let wholesalePrice = product?.priceWholesale || 0;
  let minimumQuantity = product?.minWholesaleQty || 3;
  let sellerProfileId: string | null = null;
  if (!product && typeof body.productId === 'string') {
    const { data: sellerProduct, error: sellerProductError } = await supabase.from('products')
      .select('id,name,price,seller_wholesale_price,seller_group_buy_minimum,seller_profile_id')
      .eq('id', body.productId).eq('seller_group_buy_enabled', true).eq('listing_status', 'approved').eq('is_active', true).maybeSingle();
    if (sellerProductError) return NextResponse.json({ error: 'Seller group-buy products are unavailable. Apply the latest marketplace migration.' }, { status: 503 });
    if (sellerProduct?.seller_profile_id) {
      const { data: seller } = await supabase.from('seller_profiles').select('status').eq('id', sellerProduct.seller_profile_id).maybeSingle();
      if (seller?.status === 'approved' && sellerProduct.seller_wholesale_price !== null) {
        productId = sellerProduct.id; productTitle = sellerProduct.name; retailPrice = Number(sellerProduct.price);
        wholesalePrice = Number(sellerProduct.seller_wholesale_price); minimumQuantity = Number(sellerProduct.seller_group_buy_minimum || 3);
        sellerProfileId = sellerProduct.seller_profile_id;
      }
    }
  }
  if (!productId || !validToken(body.participantToken)) return NextResponse.json({ error: 'Choose an active product with seller group buying enabled.' }, { status: 400 });

  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from('group_buys').insert({
    id,
    product_id: productId,
    product_title: productTitle,
    retail_price: retailPrice,
    wholesale_price: wholesalePrice,
    minimum_quantity: minimumQuantity,
    seller_profile_id: sellerProfileId,
    participant_count: 1,
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
  });
  if (error) return NextResponse.json({ error: 'Could not create this group buy.' }, { status: 500 });
  const { error: participantError } = await supabase.from('group_buy_participants').insert({ group_id: id, participant_token: body.participantToken });
  if (participantError) return NextResponse.json({ error: 'Could not start the group buy.' }, { status: 500 });

  return NextResponse.json({ id, productId, productTitle, retailPrice, wholesalePrice, minimumQuantity, participantCount: 1, expiresAt }, { status: 201 });
}
