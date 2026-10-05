import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSellerActor, getSellerProfile } from '@/lib/sellerAuth';
import { entitlementAllows, getSellerEntitlement } from '@/lib/sellerEntitlements';
import type { SupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const productFields = 'id, name, category, category_id, subcategory_id, product_condition_id, price, description, specs, image, images, listing_status, submitted_at, moderation_notes, reviewed_at, created_at, updated_at, seller_winga_campaign_enabled, seller_winga_commission_rate, seller_group_buy_enabled, seller_wholesale_price, seller_group_buy_minimum';

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }

async function validateProductConfiguration(client: SupabaseClient, sellerId: string, body: Record<string, unknown>) {
  const categoryId = typeof body.categoryId === 'string' ? body.categoryId : '';
  const subcategoryId = typeof body.subcategoryId === 'string' && body.subcategoryId ? body.subcategoryId : null;
  const conditionId = typeof body.conditionId === 'string' ? body.conditionId : '';
  const rawSpecs = isRecord(body.specs) ? body.specs : {};
  const rawImages = Array.isArray(body.images) ? body.images : [];
  const { data: categories, error: categoryError } = await client.from('marketplace_categories').select('id,name').eq('id', categoryId).eq('is_active', true).maybeSingle();
  if (categoryError || !categories) return { error: 'Choose an active marketplace category.', status: 400 as const };
  if (subcategoryId) {
    const { data: subcategory, error } = await client.from('marketplace_subcategories').select('id').eq('id', subcategoryId).eq('category_id', categoryId).eq('is_active', true).maybeSingle();
    if (error || !subcategory) return { error: 'Choose a subcategory from the selected category.', status: 400 as const };
  }
  const { data: condition, error: conditionError } = await client.from('product_conditions').select('id').eq('id', conditionId).eq('is_active', true).maybeSingle();
  if (conditionError || !condition) return { error: 'Choose an active product condition.', status: 400 as const };
  const { data: allAttributes, error: attributeError } = await client.from('product_attributes')
    .select('id,category_id,subcategory_id,product_condition_id,name,attribute_key,input_type,is_required,validation_rules,product_attribute_options(value,label,is_active)')
    .eq('is_active', true).order('display_order');
  if (attributeError) return { error: 'Product specifications are unavailable. Confirm the Phase 1 marketplace migration has been applied.', status: 503 as const };
  const attributes = (allAttributes || []).filter((attribute) =>
    (!attribute.category_id || attribute.category_id === categoryId) &&
    (!attribute.subcategory_id || attribute.subcategory_id === subcategoryId) &&
    (!attribute.product_condition_id || attribute.product_condition_id === conditionId));
  const allowedKeys = new Set(attributes.map((attribute) => attribute.attribute_key));
  if (Object.keys(rawSpecs).some((key) => !allowedKeys.has(key))) return { error: 'Remove specifications that are not available for this product category and condition.', status: 400 as const };
  const validatedSpecs: Record<string, unknown> = {};
  for (const attribute of attributes) {
    const value = rawSpecs[attribute.attribute_key];
    const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
    if (empty) {
      if (attribute.is_required) return { error: `${attribute.name} is required.`, status: 400 as const };
      continue;
    }
    const rules = isRecord(attribute.validation_rules) ? attribute.validation_rules : {};
    if (attribute.input_type === 'text' && (typeof value !== 'string' || value.length > Number(rules.maxLength || 500))) return { error: `${attribute.name} must be text under ${Number(rules.maxLength || 500)} characters.`, status: 400 as const };
    if (attribute.input_type === 'number' && (typeof value !== 'number' || !Number.isFinite(value) || (typeof rules.min === 'number' && value < rules.min) || (typeof rules.max === 'number' && value > rules.max))) return { error: `Enter a valid value for ${attribute.name}.`, status: 400 as const };
    if (attribute.input_type === 'boolean' && typeof value !== 'boolean') return { error: `Choose yes or no for ${attribute.name}.`, status: 400 as const };
    const options = (attribute.product_attribute_options || []).filter((option) => option.is_active).map((option) => option.value);
    if (attribute.input_type === 'select' && (typeof value !== 'string' || !options.includes(value))) return { error: `Choose an available ${attribute.name} option.`, status: 400 as const };
    if (attribute.input_type === 'multiselect' && (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !options.includes(item)))) return { error: `Choose available ${attribute.name} options.`, status: 400 as const };
    validatedSpecs[attribute.attribute_key] = value;
  }
  if (rawImages.length < 1 || rawImages.length > 8 || rawImages.some((image) => typeof image !== 'string' || !image.startsWith(`${sellerId}/`) || image.includes('..'))) return { error: 'Upload between 1 and 8 product images using your seller account.', status: 400 as const };
  const imagePaths = rawImages as string[];
  const imageUrls = imagePaths.map((path) => client.storage.from('seller-product-images').getPublicUrl(path).data.publicUrl);
  return { category: categories, subcategoryId, conditionId, specs: validatedSpecs, images: imagePaths, imageUrls };
}

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
  const [{ data: products, error: productError }, { data: categories, error: categoryError }, { data: subcategories, error: subcategoryError }, { data: conditions, error: conditionError }, { data: attributes, error: attributeError }] = await Promise.all([
    seller.actor.serviceClient.from('products').select(productFields)
      .eq('seller_profile_id', seller.profile.id)
      .order('created_at', { ascending: false }),
    seller.actor.serviceClient.from('marketplace_categories').select('id, name')
      .eq('is_active', true).order('display_order', { ascending: true }).order('name', { ascending: true }),
    seller.actor.serviceClient.from('marketplace_subcategories').select('id,category_id,name').eq('is_active', true).order('display_order'),
    seller.actor.serviceClient.from('product_conditions').select('id,name,description').eq('is_active', true).order('display_order'),
    seller.actor.serviceClient.from('product_attributes').select('id,category_id,subcategory_id,product_condition_id,name,attribute_key,input_type,is_required,display_order,validation_rules,product_attribute_options(id,value,label,is_active)').eq('is_active', true).order('display_order'),
  ]);
  if (productError || categoryError || subcategoryError || conditionError || attributeError) return NextResponse.json({ error: 'Seller marketplace data is not ready. Confirm that the marketplace migrations have been applied.' }, { status: 503 });
  const { entitlement } = await getSellerEntitlement(seller.actor.serviceClient, seller.profile.id);
  return NextResponse.json({
    products: (products || []).map((product) => ({
      ...product,
      imageUrls: (Array.isArray(product.images) ? product.images : []).map((path) => typeof path === 'string' && path.startsWith(`${seller.profile.id}/`) ? seller.actor.serviceClient.storage.from('seller-product-images').getPublicUrl(path).data.publicUrl : typeof path === 'string' && /^https?:\/\//i.test(path) ? path : '/favicon.svg'),
    })),
    categories: categories || [],
    subcategories: subcategories || [],
    conditions: conditions || [],
    attributes: attributes || [],
    sellerStatus: seller.profile.status,
    entitlement,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const seller = await currentSeller();
  if ('response' in seller) return seller.response;
  if (seller.profile.status !== 'approved') return NextResponse.json({ error: 'Your seller application must be approved before you can create product drafts.' }, { status: 403 });
  const { entitlement } = await getSellerEntitlement(seller.actor.serviceClient, seller.profile.id);
  if (!entitlementAllows(entitlement, 'product_listings')) return NextResponse.json({ error: 'An active trial or paid plan with product listing access is required.' }, { status: 402 });
  const productLimit = typeof entitlement?.plan_snapshot.product_limit === 'number' ? entitlement.plan_snapshot.product_limit : null;
  if (productLimit !== null) {
    const { count, error: countError } = await seller.actor.serviceClient.from('products').select('id', { count: 'exact', head: true }).eq('seller_profile_id', seller.profile.id).neq('listing_status', 'archived');
    if (countError) return NextResponse.json({ error: 'Could not check your plan product limit.' }, { status: 503 });
    if ((count || 0) >= productLimit) return NextResponse.json({ error: `Your current plan allows up to ${productLimit} products. Choose a higher plan to add more.` }, { status: 403 });
  }

  let body: Record<string, unknown> | null;
  try { body = readBody(await request.json()); } catch { body = null; }
  if (!body) return NextResponse.json({ error: 'Enter valid product details.' }, { status: 400 });
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const price = typeof body.price === 'number' ? body.price : Number(body.price);
  if (name.length < 2 || name.length > 300 || description.trim().length < 10 || description.length > 4000 || !Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: 'Add a product name, positive price, and description between 10 and 4,000 characters.' }, { status: 400 });
  }
  const configured = await validateProductConfiguration(seller.actor.serviceClient, seller.profile.id, body);
  if ('error' in configured) return NextResponse.json({ error: configured.error }, { status: configured.status });

  const { data, error } = await seller.actor.serviceClient.from('products').insert({
    id: `seller-${randomUUID()}`,
    seller_profile_id: seller.profile.id,
    category_id: configured.category.id,
    subcategory_id: configured.subcategoryId,
    product_condition_id: configured.conditionId,
    category: configured.category.name,
    name,
    description,
    price,
    original_price: null,
    wholesale_price: null,
    wholesale_min_qty: 3,
    image: configured.imageUrls[0] || '/favicon.svg',
    images: configured.images,
    specs: configured.specs,
    in_stock: false,
    stock_count: 0,
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
  const { entitlement } = await getSellerEntitlement(seller.actor.serviceClient, seller.profile.id);
  if (!entitlementAllows(entitlement, 'product_listings')) return NextResponse.json({ error: 'An active trial or paid plan with product listing access is required.' }, { status: 402 });

  let body: Record<string, unknown> | null;
  try { body = readBody(await request.json()); } catch { body = null; }
  if (!body) return NextResponse.json({ error: 'Enter valid product details.' }, { status: 400 });
  const id = typeof body?.id === 'string' ? body.id.trim() : '';
  if (!id || id.length > 120) return NextResponse.json({ error: 'A valid product ID is required.' }, { status: 400 });

  const { data: current, error: lookupError } = await seller.actor.serviceClient.from('products')
    .select('id, name, category_id, subcategory_id, product_condition_id, price, description, specs, images, listing_status')
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

  if (body.action === 'submit') {
    const description = typeof current.description === 'string' ? current.description.trim() : '';
    if (current.name.trim().length < 2 || description.length < 10 || description.length > 4000 || Number(current.price) <= 0) return NextResponse.json({ error: 'Complete the product name, price, and description before submitting.' }, { status: 400 });
    const configured = await validateProductConfiguration(seller.actor.serviceClient, seller.profile.id, {
      categoryId: current.category_id,
      subcategoryId: current.subcategory_id,
      conditionId: current.product_condition_id,
      specs: current.specs,
      images: current.images,
    });
    if ('error' in configured) return NextResponse.json({ error: configured.error }, { status: configured.status });
    const { data, error } = await seller.actor.serviceClient.from('products').update({ listing_status: 'pending_approval', submitted_at: new Date().toISOString(), reviewed_at: null, reviewed_by: null, approved_at: null, approved_by: null, is_active: false, moderation_notes: '', updated_at: new Date().toISOString() })
      .eq('id', id).eq('seller_profile_id', seller.profile.id).eq('listing_status', current.listing_status).select(productFields).maybeSingle();
    if (error) return NextResponse.json({ error: 'Could not submit this product for review.' }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Product status changed. Refresh and try again.' }, { status: 409 });
    return NextResponse.json({ product: data }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const price = typeof body.price === 'number' ? body.price : Number(body.price);
  if (name.length < 2 || name.length > 300 || description.trim().length < 10 || description.length > 4000 || !Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: 'Add a product name, positive price, and description between 10 and 4,000 characters.' }, { status: 400 });
  }
  const configured = await validateProductConfiguration(seller.actor.serviceClient, seller.profile.id, body);
  if ('error' in configured) return NextResponse.json({ error: configured.error }, { status: configured.status });

  const { data, error } = await seller.actor.serviceClient.from('products')
    .update({ name, description, price, category_id: configured.category.id, subcategory_id: configured.subcategoryId, product_condition_id: configured.conditionId, category: configured.category.name, specs: configured.specs, images: configured.images, image: configured.imageUrls[0] || '/favicon.svg', listing_status: 'draft', is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id).eq('seller_profile_id', seller.profile.id).eq('listing_status', current.listing_status)
    .select(productFields).maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not save product changes.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Product status changed. Refresh and try again.' }, { status: 409 });
  return NextResponse.json({ product: data }, { headers: { 'Cache-Control': 'no-store' } });
}
