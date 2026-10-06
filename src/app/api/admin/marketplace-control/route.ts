import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/adminAuth';
import { writeAdminAuditEvent } from '@/lib/adminAudit';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
const tables = {
  categories: { table: 'marketplace_categories', fields: ['name', 'slug', 'description', 'is_active', 'display_order'] },
  subcategories: { table: 'marketplace_subcategories', fields: ['category_id', 'name', 'slug', 'description', 'is_active', 'display_order'] },
  conditions: { table: 'product_conditions', fields: ['name', 'slug', 'description', 'is_active', 'display_order'] },
  attributes: { table: 'product_attributes', fields: ['category_id', 'subcategory_id', 'product_condition_id', 'name', 'attribute_key', 'input_type', 'is_required', 'is_active', 'display_order', 'validation_rules'] },
  options: { table: 'product_attribute_options', fields: ['attribute_id', 'value', 'label', 'is_active', 'display_order'] },
} as const;
type Kind = keyof typeof tables;
const admin = (request: NextRequest) => isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

export async function GET(request: NextRequest) {
  if (!admin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Marketplace administration is not configured.' }, { status: 503 });
  const [categories, subcategories, conditions, attributes, options, sellers, verifications, reports, products, featuredProducts, plans, payments, subscriptions, events] = await Promise.all([
    db.from(tables.categories.table).select('*').order('display_order').order('name'),
    db.from(tables.subcategories.table).select('*').order('display_order').order('name'),
    db.from(tables.conditions.table).select('*').order('display_order').order('name'),
    db.from(tables.attributes.table).select('*').order('display_order').order('name'),
    db.from(tables.options.table).select('*').order('display_order').order('label'),
    db.from('seller_profiles').select('id,status', { count: 'exact', head: true }),
    db.from('seller_verifications').select('id,status,verification_level,public_label,notes,reviewed_at,seller_profiles!inner(display_name,university)', { count: 'exact' }).order('updated_at', { ascending: false }).limit(100),
    db.from('marketplace_reports').select('id,reason,details,status,review_notes,created_at,product_id,seller_profile_id,products(name),seller_profiles(display_name)', { count: 'exact' }).order('created_at', { ascending: false }).limit(100),
    db.from('products').select('id,listing_status', { count: 'exact', head: true }).not('seller_profile_id', 'is', null),
    db.from('products').select('id,name,is_featured,seller_profile_id,seller_profiles(display_name)').eq('is_active', true).eq('listing_status', 'approved').order('updated_at', { ascending: false }).limit(200),
    db.from('subscription_plans').select('id', { count: 'exact', head: true }),
    db.from('subscription_payments').select('id,status', { count: 'exact' }),
    db.from('subscriptions').select('id,status', { count: 'exact' }),
    db.from('admin_audit_logs').select('id,actor,action,resource_type,resource_id,metadata,created_at').order('created_at', { ascending: false }).limit(50),
  ]);
  const failed = [categories, subcategories, conditions, attributes, options, sellers, verifications, reports, products, featuredProducts, plans, payments, subscriptions, events].find((r) => r.error);
  if (failed) return NextResponse.json({ error: 'Could not load marketplace controls. Confirm the Phase 1–6 migrations are applied.' }, { status: 503 });
  const productsByStatus = (products.data || []).reduce<Record<string, number>>((acc, row) => { acc[row.listing_status] = (acc[row.listing_status] || 0) + 1; return acc; }, {});
  const paymentsByStatus = (payments.data || []).reduce<Record<string, number>>((acc, row) => { acc[row.status] = (acc[row.status] || 0) + 1; return acc; }, {});
  return NextResponse.json({
    catalog: { categories: categories.data, subcategories: subcategories.data, conditions: conditions.data, attributes: attributes.data, options: options.data },
    verifications: (verifications.data || []).map((row) => ({ ...row, seller: Array.isArray(row.seller_profiles) ? row.seller_profiles[0] : row.seller_profiles })),
    reports: (reports.data || []).map((row) => ({ ...row, product: Array.isArray(row.products) ? row.products[0] : row.products, seller: Array.isArray(row.seller_profiles) ? row.seller_profiles[0] : row.seller_profiles })),
    featured: (featuredProducts.data || []).map((row) => ({ ...row, seller: Array.isArray(row.seller_profiles) ? row.seller_profiles[0] : row.seller_profiles })),
    analytics: { sellers: sellers.count || 0, products: products.count || 0, productsByStatus, plans: plans.count || 0, subscriptions: subscriptions.count || 0, payments: payments.count || 0, paymentsByStatus, reports: reports.count || 0, pendingReports: (reports.data || []).filter((r) => r.status === 'pending').length, verifications: verifications.count || 0 },
    audit: events.data || [],
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  if (!admin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Marketplace administration is not configured.' }, { status: 503 });
  let body: Record<string, unknown>;
  try { const value: unknown = await request.json(); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); body = value as Record<string, unknown>; }
  catch { return NextResponse.json({ error: 'Enter a valid marketplace action.' }, { status: 400 }); }
  const action = typeof body.action === 'string' ? body.action : '';
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const now = new Date().toISOString();
  let resourceType = '';
  let resourceId = id;
  if (action === 'save_catalog') {
    const kind = body.kind as Kind;
    if (!(kind in tables)) return NextResponse.json({ error: 'Choose a valid catalog type.' }, { status: 400 });
    const spec = tables[kind];
    const input = body.values && typeof body.values === 'object' && !Array.isArray(body.values) ? body.values as Record<string, unknown> : {};
    const values: Record<string, unknown> = {};
    for (const key of spec.fields) if (key in input) values[key] = input[key];
    if (typeof values.name === 'string') values.name = values.name.trim();
    if (typeof values.slug === 'string') values.slug = values.slug.trim().toLowerCase();
    if (typeof values.attribute_key === 'string') values.attribute_key = values.attribute_key.trim().toLowerCase();
    if (typeof values.display_order !== 'undefined') values.display_order = Number(values.display_order);
    if (typeof values.is_active !== 'undefined' && typeof values.is_active !== 'boolean') return NextResponse.json({ error: 'Availability must be true or false.' }, { status: 400 });
    if (!Object.keys(values).length || (typeof values.name === 'string' && (values.name.length < 2 || values.name.length > 120))) return NextResponse.json({ error: 'Provide valid catalog values.' }, { status: 400 });
    const result = id ? await db.from(spec.table).update({ ...values, updated_at: now }).eq('id', id).select('id').maybeSingle() : await db.from(spec.table).insert({ ...values, updated_at: now }).select('id').single();
    if (result.error || !result.data) return NextResponse.json({ error: 'Could not save the catalog item. Check for duplicate names or keys and existing references.' }, { status: 409 });
    resourceType = spec.table; resourceId = result.data.id;
  } else if (action === 'review_verification') {
    const status = body.status;
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
    if (!id || !['verified', 'rejected', 'suspended', 'unverified'].includes(String(status)) || notes.length > 2000) return NextResponse.json({ error: 'Choose a valid verification status and note.' }, { status: 400 });
    const { data, error } = await db.from('seller_verifications').update({ status, verification_level: typeof body.level === 'string' ? body.level.trim().slice(0, 80) || 'none' : 'none', public_label: typeof body.label === 'string' ? body.label.trim().slice(0, 80) || null : null, notes, reviewed_at: now, reviewed_by: process.env.ADMIN_USERNAME || 'admin', verified_at: status === 'verified' ? now : null, updated_at: now }).eq('id', id).select('id').maybeSingle();
    if (error || !data) return NextResponse.json({ error: 'Could not update seller verification.' }, { status: 409 });
    resourceType = 'seller_verification';
  } else if (action === 'review_report') {
    const status = body.status;
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
    if (!id || !['reviewing', 'resolved', 'dismissed'].includes(String(status)) || notes.length > 2000) return NextResponse.json({ error: 'Choose a valid report status and note.' }, { status: 400 });
    const { data, error } = await db.from('marketplace_reports').update({ status, review_notes: notes, reviewed_at: now, reviewed_by: process.env.ADMIN_USERNAME || 'admin', updated_at: now }).eq('id', id).select('id').maybeSingle();
    if (error || !data) return NextResponse.json({ error: 'Could not update marketplace report.' }, { status: 409 });
    resourceType = 'marketplace_report';
  } else if (action === 'set_featured') {
    if (!id || typeof body.featured !== 'boolean') return NextResponse.json({ error: 'Choose a product and a featured status.' }, { status: 400 });
    const { data, error } = await db.from('products').update({ is_featured: body.featured, updated_at: now }).eq('id', id).eq('listing_status', 'approved').eq('is_active', true).select('id').maybeSingle();
    if (error || !data) return NextResponse.json({ error: 'Could not update this approved product listing.' }, { status: 409 });
    resourceType = 'product';
  } else return NextResponse.json({ error: 'Choose a supported marketplace action.' }, { status: 400 });
  await writeAdminAuditEvent(request, { action: `marketplace.${action}`, resourceType, resourceId, metadata: { status: String(body.status || 'saved') } });
  return NextResponse.json({ ok: true });
}
