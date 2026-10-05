import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { writeAdminAuditEvent } from '@/lib/adminAudit';
import { MOCK_PRODUCTS } from '@/lib/mockData';

function isAdmin(req: NextRequest) {
  return isValidAdminSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

async function readJsonObject(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json();
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ products: MOCK_PRODUCTS, configured: false });
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .is('seller_profile_id', null)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ products: MOCK_PRODUCTS, configured: true, fallback: true });
  }

  return NextResponse.json({ products: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });

  if (!body.name || !body.price || !body.category) {
    return NextResponse.json({ error: 'Name, price, and category are required.' }, { status: 400 });
  }

  const id = (typeof body.id === 'string' ? body.id.trim() : '') || `prod-${Date.now()}`;
  const { data: existing, error: existingError } = await supabase.from('products').select('seller_profile_id').eq('id', id).maybeSingle();
  if (existingError) return NextResponse.json({ error: 'Could not verify product ownership.' }, { status: 503 });
  if (existing?.seller_profile_id) return NextResponse.json({ error: 'Seller listings must be reviewed in the product moderation queue.' }, { status: 409 });
  const image = typeof body.image === 'string' ? body.image : '/images/products/generic.webp';
  const newProduct = {
    id,
    seller_profile_id: null,
    name: String(body.name).trim().slice(0, 300),
    category: String(body.category).trim().slice(0, 100),
    price: Number(body.price),
    original_price: body.originalPrice ? Number(body.originalPrice) : null,
    wholesale_price: body.wholesalePrice ? Number(body.wholesalePrice) : null,
    wholesale_min_qty: Number(body.wholesaleMinQty) || 3,
    image,
    images: Array.isArray(body.images) ? body.images.filter((entry): entry is string => typeof entry === 'string') : [image],
    badge: typeof body.badge === 'string' ? body.badge : null,
    in_stock: body.inStock !== undefined ? Boolean(body.inStock) : true,
    stock_count: Number(body.stockCount) || 10,
    description: String(body.description || '').trim(),
    specs: typeof body.specs === 'object' && body.specs ? body.specs : {},
    is_featured: Boolean(body.isFeatured),
    is_bundle_eligible: body.isBundleEligible !== undefined ? Boolean(body.isBundleEligible) : true,
    is_active: body.isActive !== undefined ? Boolean(body.isActive) : true,
    listing_status: 'approved',
  };

  const { data, error } = await supabase
    .from('products')
    .upsert(newProduct)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Could not save product: ' + (error?.message || '') }, { status: 500 });
  }

  await writeAdminAuditEvent(req, {
    action: 'product.upsert',
    resourceType: 'product',
    resourceId: data.id,
    metadata: { name: data.name, price: data.price },
  });

  return NextResponse.json({ product: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Not configured.' }, { status: 503 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });

  if (typeof body.id !== 'string' || !body.id.trim()) return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.price !== undefined) updates.price = Number(body.price);
  if (body.wholesalePrice !== undefined) updates.wholesale_price = Number(body.wholesalePrice);
  if (body.inStock !== undefined) updates.in_stock = Boolean(body.inStock);
  if (body.stockCount !== undefined) updates.stock_count = Number(body.stockCount);
  if (body.isFeatured !== undefined) updates.is_featured = Boolean(body.isFeatured);
  if (body.isActive !== undefined) updates.is_active = Boolean(body.isActive);
  if (body.name !== undefined) updates.name = String(body.name).trim().slice(0, 300);

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', body.id.trim())
    .is('seller_profile_id', null)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: 'Could not update product.' }, { status: 500 });

  await writeAdminAuditEvent(req, {
    action: 'product.update',
    resourceType: 'product',
    resourceId: String(data.id),
    metadata: { name: data.name, in_stock: data.in_stock },
  });

  return NextResponse.json({ product: data }, { headers: { 'Cache-Control': 'no-store' } });
}
