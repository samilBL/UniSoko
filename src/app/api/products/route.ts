import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { Product } from '@/lib/types';

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number | string;
  wholesale_price: number | string | null;
  in_stock: boolean;
  images: unknown;
  image: string;
  specs: unknown;
  wholesale_min_qty: number | null;
  is_featured: boolean;
  seller_profile_id?: string | null;
  seller_group_buy_enabled?: boolean;
  seller_wholesale_price?: number | string | null;
  seller_group_buy_minimum?: number | null;
  seller_winga_campaign_enabled?: boolean;
  seller_winga_commission_rate?: number | string;
  product_condition_id?: string | null;
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ products: MOCK_PRODUCTS, source: 'mock' });
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('listing_status', 'approved')
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    return NextResponse.json({ products: MOCK_PRODUCTS, source: 'fallback' });
  }

  const sellerIds = [...new Set(data.map((product) => product.seller_profile_id).filter((id): id is string => Boolean(id)))];
  let visibleRows = data as ProductRow[];
  let sellerNames = new Map<string, string>();
  if (sellerIds.length) {
    const { data: approvedSellers, error: sellerError } = await supabase.from('seller_profiles').select('id,display_name').in('id', sellerIds).eq('status', 'approved');
    if (sellerError) return NextResponse.json({ products: MOCK_PRODUCTS, source: 'fallback' });
    const approvedIds = new Set((approvedSellers || []).map((seller) => seller.id));
    sellerNames = new Map((approvedSellers || []).map((seller) => [seller.id, seller.display_name]));
    visibleRows = visibleRows.filter((product) => !product.seller_profile_id || approvedIds.has(product.seller_profile_id));
  }

  const formatted: Product[] = visibleRows.map((p: ProductRow) => ({
    id: p.id,
    title: p.name,
    description: p.description || '',
    category: p.category as Product['category'],
    priceRetail: Number(p.price),
    priceWholesale: Number(p.seller_profile_id ? p.seller_wholesale_price || p.price : p.wholesale_price || p.price),
    condition: 'Brand New',
    stockStatus: p.in_stock ? 'In Stock' : 'Coming Soon',
    images: Array.isArray(p.images) && p.images.every((image): image is string => typeof image === 'string') && p.images.length > 0
      ? p.images.map((image) => p.seller_profile_id && !/^https?:\/\//i.test(image) && image.startsWith(`${p.seller_profile_id}/`) ? supabase.storage.from('seller-product-images').getPublicUrl(image).data.publicUrl : image)
      : [p.image],
    specs: typeof p.specs === 'object' && p.specs ? p.specs as Record<string, string> : {},
    minWholesaleQty: p.seller_profile_id ? p.seller_group_buy_minimum || 3 : p.wholesale_min_qty || 3,
    featured: Boolean(p.is_featured),
    warrantyDays: 30,
    sellerProfileId: p.seller_profile_id || undefined,
    sellerDisplayName: p.seller_profile_id ? sellerNames.get(p.seller_profile_id) : undefined,
    sellerGroupBuyEnabled: Boolean(p.seller_group_buy_enabled),
    sellerWingaCampaignEnabled: Boolean(p.seller_winga_campaign_enabled),
    sellerWingaCommissionRate: Number(p.seller_winga_commission_rate || 0),
  }));

  return NextResponse.json({ products: formatted, source: 'database' }, {
    headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' }
  });
}
