import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/adminAuth';
import { writeAdminAuditEvent } from '@/lib/adminAudit';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Subscription review is not configured.' }, { status: 503 });
  const [{ data: payments, error }, { data: plans, error: planError }, { data: methods, error: methodError }, { data: trialSetting, error: settingError }] = await Promise.all([
    supabase.from('subscription_payments').select('id,subscription_id,amount,currency,payment_method_snapshot,transaction_reference,status,submitted_at,rejection_reason,subscriptions!inner(seller_profile_id,plan_snapshot,seller_profiles!inner(display_name,university))').order('submitted_at', { ascending: false }),
    supabase.from('subscription_plans').select('id,name,slug,description,plan_type,price,currency,duration_days,product_limit,limits,verification_level,is_popular,is_active,display_order').order('display_order'),
    supabase.from('payment_settings').select('id,name,instructions,public_details,is_active,display_order').order('display_order'),
    supabase.from('marketplace_settings').select('setting_value').eq('setting_key', 'seller_trial_duration_days').maybeSingle(),
  ]);
  if (error || planError || methodError || settingError) return NextResponse.json({ error: 'Could not load subscription settings. Confirm the Phase 3 migration has been applied.' }, { status: 503 });
  return NextResponse.json({ payments: payments || [], plans: plans || [], paymentMethods: methods || [], trialDurationDays: Number(trialSetting?.setting_value ?? 30) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  if (!isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Subscription review is not configured.' }, { status: 503 });
  let body: Record<string, unknown>;
  try { const value: unknown = await request.json(); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); body = value as Record<string, unknown>; }
  catch { return NextResponse.json({ error: 'Enter a valid subscription action.' }, { status: 400 }); }
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const action = typeof body.action === 'string' ? body.action : '';
  if (action === 'update_trial_duration') {
    const days = Number(body.days);
    if (!Number.isInteger(days) || days < 1 || days > 365) return NextResponse.json({ error: 'Trial duration must be from 1 to 365 days.' }, { status: 400 });
    const { error } = await supabase.from('marketplace_settings').upsert({ setting_key: 'seller_trial_duration_days', setting_value: days, description: 'Default duration for newly approved seller trials, in days.', updated_by: process.env.ADMIN_USERNAME || 'admin', updated_at: new Date().toISOString() }, { onConflict: 'setting_key' });
    if (error) return NextResponse.json({ error: 'Could not update the trial duration.' }, { status: 500 });
    await writeAdminAuditEvent(request, { action: 'seller.trial_duration.update', resourceType: 'marketplace_setting', resourceId: 'seller_trial_duration_days', metadata: { days } });
    return NextResponse.json({ ok: true, trialDurationDays: days });
  }
  if (action === 'update_plan') {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const price = Number(body.price);
    const durationDays = Number(body.durationDays);
    const productLimit = body.productLimit === null || body.productLimit === '' ? null : Number(body.productLimit);
    if (!id || name.length < 2 || name.length > 100 || description.length > 2000 || !Number.isFinite(price) || price < 0 || !Number.isInteger(durationDays) || durationDays < 1 || (productLimit !== null && (!Number.isInteger(productLimit) || productLimit < 0)) || typeof body.isActive !== 'boolean' || typeof body.isPopular !== 'boolean') return NextResponse.json({ error: 'Check the plan name, price, duration, product limit, and availability.' }, { status: 400 });
    const { data, error } = await supabase.from('subscription_plans').update({ name, description, price, duration_days: durationDays, product_limit: productLimit, is_active: body.isActive, is_popular: body.isPopular, updated_at: new Date().toISOString() }).eq('id', id).eq('plan_type', 'paid').select('id,name,price,currency,duration_days,product_limit,is_active,is_popular').maybeSingle();
    if (error || !data) return NextResponse.json({ error: 'Could not update this plan.' }, { status: 500 });
    await writeAdminAuditEvent(request, { action: 'seller.plan.update', resourceType: 'subscription_plan', resourceId: id, metadata: { price, durationDays, isActive: body.isActive } });
    return NextResponse.json({ ok: true, plan: data });
  }
  if (action === 'update_payment_method') {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const instructions = typeof body.instructions === 'string' ? body.instructions.trim() : '';
    const publicDetails = body.publicDetails && typeof body.publicDetails === 'object' && !Array.isArray(body.publicDetails) ? body.publicDetails : null;
    if (!id || name.length < 2 || name.length > 100 || instructions.length < 1 || instructions.length > 4000 || !publicDetails || typeof body.isActive !== 'boolean') return NextResponse.json({ error: 'Check the payment method name, instructions, and public details.' }, { status: 400 });
    const { data, error } = await supabase.from('payment_settings').update({ name, instructions, public_details: publicDetails, is_active: body.isActive, updated_at: new Date().toISOString() }).eq('id', id).select('id,name,is_active').maybeSingle();
    if (error || !data) return NextResponse.json({ error: 'Could not update this payment method.' }, { status: 500 });
    await writeAdminAuditEvent(request, { action: 'seller.payment_method.update', resourceType: 'payment_settings', resourceId: id, metadata: { isActive: body.isActive } });
    return NextResponse.json({ ok: true, paymentMethod: data });
  }
  if (!id || id.length > 120 || !['approve', 'reject'].includes(action)) return NextResponse.json({ error: 'Choose a payment and approve or reject it.' }, { status: 400 });
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (reason.length > 2000 || (action === 'reject' && reason.length < 3)) return NextResponse.json({ error: 'Add a rejection reason under 2,000 characters.' }, { status: 400 });
  const { data, error } = await supabase.rpc('review_seller_plan_payment', { p_payment_id: id, p_decision: action === 'approve' ? 'approved' : 'rejected', p_reason: reason, p_reviewed_by: process.env.ADMIN_USERNAME || 'admin' });
  if (error) {
    if (error.code === 'P0002') return NextResponse.json({ error: 'This payment is no longer pending.' }, { status: 409 });
    console.error('Seller payment review failed', { code: error.code });
    return NextResponse.json({ error: 'Could not review this payment.' }, { status: 500 });
  }
  await writeAdminAuditEvent(request, { action: `seller.payment.${action}`, resourceType: 'subscription_payment', resourceId: id, metadata: { status: action === 'approve' ? 'approved' : 'rejected' } });
  return NextResponse.json({ ok: true, result: data }, { headers: { 'Cache-Control': 'no-store' } });
}
