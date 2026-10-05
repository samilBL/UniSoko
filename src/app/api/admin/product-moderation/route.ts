import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/adminAuth';
import { writeAdminAuditEvent } from '@/lib/adminAudit';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function isAdmin(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Product moderation is not configured.' }, { status: 503 });
  const { data, error } = await supabase.from('products')
    .select('id,name,category,category_id,subcategory_id,product_condition_id,price,description,specs,image,images,listing_status,submitted_at,moderation_notes,reviewed_at,reviewed_by,seller_profile_id,seller_profiles!inner(display_name,university,status)')
    .not('seller_profile_id', 'is', null)
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load seller products. Confirm the Phase 5 migration has been applied.' }, { status: 503 });
  return NextResponse.json({ products: (data || []).map((product) => ({
    ...product,
    sellerProfile: Array.isArray(product.seller_profiles) ? product.seller_profiles[0] : product.seller_profiles,
    imageUrls: (Array.isArray(product.images) ? product.images : []).map((path) => typeof path === 'string' && path.startsWith(`${product.seller_profile_id}/`) ? supabase.storage.from('seller-product-images').getPublicUrl(path).data.publicUrl : typeof path === 'string' && /^https?:\/\//i.test(path) ? path : product.image),
  })) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Product moderation is not configured.' }, { status: 503 });
  let body: Record<string, unknown>;
  try { const value: unknown = await request.json(); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); body = value as Record<string, unknown>; }
  catch { return NextResponse.json({ error: 'Enter a valid moderation decision.' }, { status: 400 }); }
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const action = typeof body.action === 'string' ? body.action : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  if (!id || id.length > 120 || !['approve', 'reject', 'request_changes'].includes(action)) return NextResponse.json({ error: 'Choose a product and a valid review decision.' }, { status: 400 });
  if (notes.length > 2000 || (action !== 'approve' && notes.length < 3)) return NextResponse.json({ error: 'Add review feedback between 3 and 2,000 characters for this decision.' }, { status: 400 });
  const { data: current, error: lookupError } = await supabase.from('products')
    .select('id,seller_profile_id,listing_status,seller_profiles!inner(status)')
    .eq('id', id).not('seller_profile_id', 'is', null).maybeSingle();
  if (lookupError) return NextResponse.json({ error: 'Could not load the seller product.' }, { status: 503 });
  if (!current) return NextResponse.json({ error: 'Seller product not found.' }, { status: 404 });
  if (current.listing_status !== 'pending_approval') return NextResponse.json({ error: 'This product is no longer awaiting review.' }, { status: 409 });
  const nextStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'changes_requested';
  const sellerRelation = current.seller_profiles as unknown as { status: string } | { status: string }[];
  const sellerStatus = Array.isArray(sellerRelation) ? sellerRelation[0]?.status : sellerRelation.status;
  if (action === 'approve' && sellerStatus !== 'approved') return NextResponse.json({ error: 'The seller account is not approved. Approve the seller before publishing their products.' }, { status: 409 });
  const now = new Date().toISOString();
  const { data, error } = await supabase.from('products').update({
    listing_status: nextStatus,
    is_active: action === 'approve',
    ...(action === 'approve' ? { in_stock: true } : {}),
    moderation_notes: action === 'approve' ? '' : notes,
    reviewed_at: now,
    reviewed_by: process.env.ADMIN_USERNAME || 'admin',
    ...(action === 'approve' ? { approved_at: now, approved_by: process.env.ADMIN_USERNAME || 'admin' } : {}),
    updated_at: now,
  }).eq('id', id).eq('seller_profile_id', current.seller_profile_id).eq('listing_status', 'pending_approval')
    .select('id,name,listing_status,is_active,moderation_notes,reviewed_at').maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not save the moderation decision.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Product status changed. Refresh and try again.' }, { status: 409 });
  await writeAdminAuditEvent(request, { action: `seller.product.${action}`, resourceType: 'product', resourceId: id, metadata: { status: nextStatus } });
  return NextResponse.json({ product: data }, { headers: { 'Cache-Control': 'no-store' } });
}
