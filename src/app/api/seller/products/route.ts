import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSellerActor, getSellerProfile } from '@/lib/sellerAuth';

export const dynamic = 'force-dynamic';

const productFields = 'id, name, category, category_id, price, description, listing_status, created_at, updated_at';

function readBody(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

async function currentSeller() {
  const actor = await getSellerActor();
  if (actor.kind !== 'ok') return { response: NextResponse.json({ error: actor.kind === 'unavailable' ? 'Seller accounts are not configured.' : 'Sign in with your verified UniSoko account.' }, { status: actor.kind === 'unavailable' ? 503 : 401 }) };
  const { data: profile, error } = await getSellerProfile(actor.serviceClient, actor.user.id);
  if (error) return { response: NextResponse.json({ error: 'Could not load your seller profile.' }, { status: 500 }) };
  if (!profile) return { response: NextResponse.json({ error: 'Submit a seller application before managing products.' }, { status: 403 }) };
  return { actor, profile };
}

export async function GET() {
  const seller = await currentSeller();
  if ('response' in seller) return seller.response;
  const [{ data: products, error: productError }, { data: categories, error: categoryError }] = await Promise.all([
    seller.actor.serviceClient.from('products').select(productFields)
      .eq('seller_profile_id', seller.profile.id)
      .order('created_at', { ascending: false }),
    seller.actor.serviceClient.from('marketplace_categories').select('id, name')
      .eq('is_active', true).order('display_order', { ascending: true }).order('name', { ascending: true }),
  ]);
  if (productError || categoryError) return NextResponse.json({ error: 'Seller marketplace data is not ready. Confirm that the marketplace migrations have been applied.' }, { status: 503 });
  return NextResponse.json({
    products: products || [],
    categories: categories || [],
    sellerStatus: seller.profile.status,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const seller = await currentSeller();
  if ('response' in seller) return seller.response;
  if (seller.profile.status !== 'approved') return NextResponse.json({ error: 'Your seller application must be approved before you can create product drafts.' }, { status: 403 });

  let body: Record<string, unknown> | null;
  try { body = readBody(await request.json()); } catch { body = null; }
  if (!body) return NextResponse.json({ error: 'Enter valid product details.' }, { status: 400 });
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const price = typeof body.price === 'number' ? body.price : Number(body.price);
  const categoryId = typeof body.categoryId === 'string' ? body.categoryId.trim() : '';
  if (name.length < 2 || name.length > 300 || description.length > 4000 || !Number.isFinite(price) || price <= 0 || !categoryId) {
    return NextResponse.json({ error: 'Add a product name, category, positive price, and description under 4,000 characters.' }, { status: 400 });
  }

  const { data: category, error: categoryError } = await seller.actor.serviceClient.from('marketplace_categories')
    .select('id, name').eq('id', categoryId).eq('is_active', true).maybeSingle();
  if (categoryError) return NextResponse.json({ error: 'Could not validate the selected category.' }, { status: 500 });
  if (!category) return NextResponse.json({ error: 'Choose an active marketplace category.' }, { status: 400 });

  const { data, error } = await seller.actor.serviceClient.from('products').insert({
    id: `seller-${randomUUID()}`,
    seller_profile_id: seller.profile.id,
    category_id: category.id,
    category: category.name,
    name,
    description,
    price,
    original_price: null,
    wholesale_price: null,
    wholesale_min_qty: 3,
    image: '/favicon.svg',
    images: ['/favicon.svg'],
    in_stock: false,
    stock_count: 0,
    specs: {},
    is_featured: false,
    is_bundle_eligible: false,
    is_active: false,
    listing_status: 'draft',
  }).select(productFields).single();
  if (error || !data) {
    console.error('Seller draft creation failed', { code: error?.code });
    return NextResponse.json({ error: 'Could not save this draft.' }, { status: 500 });
  }
  return NextResponse.json({ product: data }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  const seller = await currentSeller();
  if ('response' in seller) return seller.response;
  if (seller.profile.status !== 'approved') return NextResponse.json({ error: 'Only approved sellers can manage product drafts.' }, { status: 403 });

  let body: Record<string, unknown> | null;
  try { body = readBody(await request.json()); } catch { body = null; }
  if (!body) return NextResponse.json({ error: 'Enter valid product details.' }, { status: 400 });
  const id = typeof body?.id === 'string' ? body.id.trim() : '';
  if (!id || id.length > 120) return NextResponse.json({ error: 'A valid product ID is required.' }, { status: 400 });

  const { data: current, error: lookupError } = await seller.actor.serviceClient.from('products')
    .select('id, listing_status')
    .eq('id', id)
    .eq('seller_profile_id', seller.profile.id)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: 'Could not load this product.' }, { status: 500 });
  if (!current) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  if (!['draft', 'rejected', 'changes_requested'].includes(current.listing_status)) {
    return NextResponse.json({ error: 'Only drafts or products returned for changes can be edited in this phase.' }, { status: 409 });
  }

  if (body.action === 'archive') {
    const { data, error } = await seller.actor.serviceClient.from('products')
      .update({ listing_status: 'archived', is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id).eq('seller_profile_id', seller.profile.id).eq('listing_status', current.listing_status)
      .select(productFields).maybeSingle();
    if (error) return NextResponse.json({ error: 'Could not archive this draft.' }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Product status changed. Refresh and try again.' }, { status: 409 });
    return NextResponse.json({ product: data }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const price = typeof body.price === 'number' ? body.price : Number(body.price);
  const categoryId = typeof body.categoryId === 'string' ? body.categoryId.trim() : '';
  if (name.length < 2 || name.length > 300 || description.length > 4000 || !Number.isFinite(price) || price <= 0 || !categoryId) {
    return NextResponse.json({ error: 'Add a product name, category, positive price, and description under 4,000 characters.' }, { status: 400 });
  }
  const { data: category, error: categoryError } = await seller.actor.serviceClient.from('marketplace_categories')
    .select('id, name').eq('id', categoryId).eq('is_active', true).maybeSingle();
  if (categoryError) return NextResponse.json({ error: 'Could not validate the selected category.' }, { status: 500 });
  if (!category) return NextResponse.json({ error: 'Choose an active marketplace category.' }, { status: 400 });

  const { data, error } = await seller.actor.serviceClient.from('products')
    .update({ name, description, price, category_id: category.id, category: category.name, listing_status: 'draft', is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id).eq('seller_profile_id', seller.profile.id).eq('listing_status', current.listing_status)
    .select(productFields).maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not save product changes.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Product status changed. Refresh and try again.' }, { status: 409 });
  return NextResponse.json({ product: data }, { headers: { 'Cache-Control': 'no-store' } });
}
