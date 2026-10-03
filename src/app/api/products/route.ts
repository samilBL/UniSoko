import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { Product } from '@/lib/types';

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ products: MOCK_PRODUCTS, source: 'mock' });
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    return NextResponse.json({ products: MOCK_PRODUCTS, source: 'fallback' });
  }

  const formatted: Product[] = data.map((p: any) => ({
    id: p.id,
    title: p.name,
    description: p.description || '',
    category: p.category,
    priceRetail: Number(p.price),
    priceWholesale: Number(p.wholesale_price || p.price),
    condition: 'Brand New',
    stockStatus: p.in_stock ? 'In Stock' : 'Coming Soon',
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image],
    specs: typeof p.specs === 'object' && p.specs ? p.specs : {},
    minWholesaleQty: p.wholesale_min_qty || 3,
    featured: Boolean(p.is_featured),
    warrantyDays: 30,
  }));

  return NextResponse.json({ products: formatted, source: 'database' }, {
    headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' }
  });
}
