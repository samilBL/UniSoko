import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { getGroupBuyUnitPrice } from '@/lib/pricing';

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
  status?: string;
}

interface ParticipantRow {
  id: string;
  participant_token: string;
  product_id?: string | null;
  product_title?: string | null;
  retail_price?: number | null;
  wholesale_price?: number | null;
  created_at: string;
}

function mapGroup(group: GroupBuyRow, participants: ParticipantRow[] = []) {
  const isExpired = new Date(group.expires_at).getTime() <= Date.now() || group.status === 'closed';
  return {
    id: group.id,
    productId: group.product_id,
    productTitle: group.product_title,
    retailPrice: Number(group.retail_price),
    groupBuyPrice: getGroupBuyUnitPrice(Number(group.retail_price)),
    minimumQuantity: Number(group.minimum_quantity),
    participantCount: Math.max(Number(group.participant_count || 1), participants.length),
    createdAt: group.created_at,
    expiresAt: group.expires_at,
    status: group.status || (isExpired ? 'closed' : 'open'),
    isExpired,
    participants: participants.map((p, index) => ({
      id: p.id || `p-${index}`,
      productId: p.product_id || group.product_id,
      productTitle: p.product_title || group.product_title,
      retailPrice: Number(p.retail_price ?? group.retail_price),
      groupBuyPrice: getGroupBuyUnitPrice(Number(p.retail_price ?? group.retail_price)),
      createdAt: p.created_at,
    })),
  };
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  const { id } = await context.params;

  if (!supabase) {
    // Provide responsive mock fallback for development/demo
    const defaultProduct = MOCK_PRODUCTS[0];
    const mockGroup: GroupBuyRow = {
      id,
      product_id: defaultProduct.id,
      product_title: defaultProduct.title,
      retail_price: defaultProduct.priceRetail,
      wholesale_price: getGroupBuyUnitPrice(defaultProduct.priceRetail),
      minimum_quantity: 3,
      participant_count: 1,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      expires_at: new Date(Date.now() + 23 * 3600000).toISOString(),
      status: 'open',
    };
    return NextResponse.json({
      group: mapGroup(mockGroup, [
        {
          id: 'host-1',
          participant_token: 'host-token',
          product_id: defaultProduct.id,
          product_title: defaultProduct.title,
          retail_price: defaultProduct.priceRetail,
          wholesale_price: getGroupBuyUnitPrice(defaultProduct.priceRetail),
          created_at: mockGroup.created_at,
        },
      ]),
    });
  }

  const { data, error } = await supabase.from('group_buys').select('*').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not load this group buy.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Group buy not found.' }, { status: 404 });

  // Fetch participants if table exists
  let participants: ParticipantRow[] = [];
  try {
    const { data: partData } = await supabase
      .from('group_buy_participants')
      .select('id, participant_token, product_id, product_title, retail_price, wholesale_price, created_at')
      .eq('group_id', id)
      .order('created_at', { ascending: true });
    if (partData && Array.isArray(partData)) {
      participants = partData as ParticipantRow[];
    }
  } catch {
    // table or column might be absent in older migrations
  }

  return NextResponse.json(
    { group: mapGroup(data as GroupBuyRow, participants) },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  const { id } = await context.params;

  let body: {
    participantToken?: string;
    productId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid join request.' }, { status: 400 });
  }

  if (typeof body.participantToken !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.participantToken)) {
    return NextResponse.json({ error: 'Invalid participant token.' }, { status: 400 });
  }

  if (!supabase) {
    // Mock response when DB is not connected
    const product = MOCK_PRODUCTS.find((p) => p.id === body.productId) || (!body.productId ? MOCK_PRODUCTS[0] : null);
    if (!product || product.stockStatus === 'Coming Soon') {
      return NextResponse.json({ error: 'Choose an available product from the UniSoko catalog.' }, { status: 400 });
    }
    const mockGroup: GroupBuyRow = {
      id,
      product_id: product.id,
      product_title: product.title,
      retail_price: product.priceRetail,
      wholesale_price: getGroupBuyUnitPrice(product.priceRetail),
      minimum_quantity: 3,
      participant_count: 2,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      expires_at: new Date(Date.now() + 23 * 3600000).toISOString(),
      status: 'open',
    };
    return NextResponse.json({
      group: mapGroup(mockGroup, [
        {
          id: 'p-1',
          participant_token: 'host-token',
          product_id: MOCK_PRODUCTS[0].id,
          product_title: MOCK_PRODUCTS[0].title,
          retail_price: MOCK_PRODUCTS[0].priceRetail,
          wholesale_price: getGroupBuyUnitPrice(MOCK_PRODUCTS[0].priceRetail),
          created_at: mockGroup.created_at,
        },
        {
          id: 'p-2',
          participant_token: body.participantToken,
          product_id: product.id,
          product_title: product.title,
          retail_price: product.priceRetail,
          wholesale_price: getGroupBuyUnitPrice(product.priceRetail),
          created_at: new Date().toISOString(),
        },
      ]),
    });
  }

  const { data: currentGroup, error: groupError } = await supabase
    .from('group_buys')
    .select('id, expires_at, status, product_id, product_title, retail_price, wholesale_price, participant_count, minimum_quantity')
    .eq('id', id)
    .maybeSingle();

  if (groupError) return NextResponse.json({ error: 'Could not check this group buy.' }, { status: 503 });
  if (!currentGroup) return NextResponse.json({ error: 'Group buy not found.' }, { status: 404 });
  if (currentGroup.status === 'closed') return NextResponse.json({ error: 'This group buy is closed.' }, { status: 409 });
  if (new Date(currentGroup.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: 'This group buy has expired.' }, { status: 410 });
  }

  // Determine which product this participant selected (host's product or chosen from any store)
  let chosenProductId = currentGroup.product_id;
  let chosenTitle = currentGroup.product_title;
  let chosenRetail = Number(currentGroup.retail_price);
  let chosenGroupBuyPrice = getGroupBuyUnitPrice(chosenRetail);

  if (body.productId && body.productId !== currentGroup.product_id) {
    const catalogProduct = MOCK_PRODUCTS.find((p) => p.id === body.productId);
    if (catalogProduct) {
      chosenProductId = catalogProduct.id;
      chosenTitle = catalogProduct.title;
      chosenRetail = catalogProduct.priceRetail;
      chosenGroupBuyPrice = getGroupBuyUnitPrice(chosenRetail);
    } else {
      // Check database products
      const { data: dbProduct } = await supabase
        .from('products')
        .select('id, name, price, seller_profile_id, in_stock, listing_status, is_active')
        .eq('id', body.productId)
        .eq('listing_status', 'approved')
        .eq('is_active', true)
        .eq('in_stock', true)
        .maybeSingle();
      if (dbProduct) {
        let productSellerApproved = true;
        if (dbProduct.seller_profile_id) {
          const { data: seller } = await supabase.from('seller_profiles').select('status').eq('id', dbProduct.seller_profile_id).maybeSingle();
          productSellerApproved = seller?.status === 'approved';
        }
        if (!productSellerApproved) return NextResponse.json({ error: 'This store product is not currently available.' }, { status: 409 });
        chosenProductId = dbProduct.id;
        chosenTitle = dbProduct.name;
        chosenRetail = Number(dbProduct.price);
        chosenGroupBuyPrice = getGroupBuyUnitPrice(chosenRetail);
      } else {
        return NextResponse.json({ error: 'Choose an available product from the UniSoko catalog.' }, { status: 400 });
      }
    }
  }

  // Attempt to call join_group_buy_with_product or join_group_buy
  let updatedGroup = null;
  const { data: rpcData, error: rpcError } = await supabase.rpc('join_group_buy_with_product', {
    target_group_id: id,
    joining_token: body.participantToken,
    joining_product_id: chosenProductId,
    joining_product_title: chosenTitle,
    joining_retail_price: chosenRetail,
    joining_wholesale_price: chosenGroupBuyPrice,
  });

  if (!rpcError && rpcData) {
    updatedGroup = Array.isArray(rpcData) ? rpcData[0] : rpcData;
  } else {
    // Fallback: direct table operations if multi-product RPC not available
    try {
      const { data: existingParticipant } = await supabase
        .from('group_buy_participants')
        .select('id')
        .eq('group_id', id)
        .eq('participant_token', body.participantToken)
        .maybeSingle();

      if (!existingParticipant) {
        await supabase.from('group_buy_participants').insert({
          group_id: id,
          participant_token: body.participantToken,
          product_id: chosenProductId,
          product_title: chosenTitle,
          retail_price: chosenRetail,
          wholesale_price: chosenGroupBuyPrice,
        });

        const { data: incGroup } = await supabase
          .from('group_buys')
          .update({ participant_count: (currentGroup.participant_count || 1) + 1 })
          .eq('id', id)
          .select()
          .single();
        updatedGroup = incGroup;
      } else {
        updatedGroup = currentGroup;
      }
    } catch {
      // Last resort: invoke join_group_buy
      const { data: fallbackData } = await supabase.rpc('join_group_buy', {
        target_group_id: id,
        joining_token: body.participantToken,
      });
      updatedGroup = Array.isArray(fallbackData) ? fallbackData[0] : fallbackData;
    }
  }

  // Fetch updated participants
  let participants: ParticipantRow[] = [];
  try {
    const { data: partData } = await supabase
      .from('group_buy_participants')
      .select('id, participant_token, product_id, product_title, retail_price, wholesale_price, created_at')
      .eq('group_id', id)
      .order('created_at', { ascending: true });
    if (partData && Array.isArray(partData)) {
      participants = partData as ParticipantRow[];
    }
  } catch {
    // Ignore
  }

  const resultGroup = (updatedGroup || currentGroup) as GroupBuyRow;
  return NextResponse.json({ group: mapGroup(resultGroup, participants) });
}
