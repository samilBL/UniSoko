import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { AD_PACKAGE_PRICES, AD_TARGET_CAMPUSES, getAdvertisingFee, type SelfServeAdPackage } from '@/lib/advertising';

export const dynamic = 'force-dynamic';

function publicUrl(value: unknown, required = false) {
  if (typeof value !== 'string' || !value.trim()) return required ? null : '';
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch { return null; }
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Advertising is not configured.' }, { status: 503 });
  const { data, error } = await supabase.from('payment_settings').select('id,name,instructions,public_details').eq('is_active', true).order('display_order');
  if (error) return NextResponse.json({ error: 'Advertising payment methods are not available. Apply the marketplace payments migration.' }, { status: 503 });
  const paymentMethods = (data || []).map((method) => ({
    id: method.id,
    name: method.name,
    instructions: method.instructions,
    details: method.public_details,
  }));
  return NextResponse.json({ paymentMethods, packages: AD_PACKAGE_PRICES }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Advertising applications are not configured.' }, { status: 503 });
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid payload.');
    body = parsed as Record<string, unknown>;
  } catch { return NextResponse.json({ error: 'Invalid advertising application.' }, { status: 400 }); }

  const businessName = typeof body.businessName === 'string' ? body.businessName.trim() : '';
  const contactPerson = typeof body.contactPerson === 'string' ? body.contactPerson.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const packageType = body.packageType;
  const durationWeeks = Number(body.durationWeeks);
  const campuses = body.targetCampuses;
  const campaignTitle = typeof body.campaignTitle === 'string' ? body.campaignTitle.trim() : '';
  const campaignDetails = typeof body.campaignDetails === 'string' ? body.campaignDetails.trim() : '';
  const transactionReference = typeof body.transactionReference === 'string' ? body.transactionReference.trim().toUpperCase() : '';
  const paymentMethodId = typeof body.paymentMethodId === 'string' ? body.paymentMethodId : '';
  const normalizedCampuses = Array.isArray(campuses) ? [...new Set(campuses)] : [];
  const creativeUrl = publicUrl(body.creativeUrl, true);
  const destinationUrl = publicUrl(body.destinationUrl, false);

  if (businessName.length < 2 || businessName.length > 160 || !phone || phone.length > 40 ||
      contactPerson.length > 120 || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email) && email.length > 0 ||
      typeof packageType !== 'string' || !Object.hasOwn(AD_PACKAGE_PRICES, packageType) ||
      !Number.isInteger(durationWeeks) || durationWeeks < 1 || durationWeeks > 4 ||
      packageType === 'Campus Community Blast' && durationWeeks !== 1 ||
      !Array.isArray(campuses) || normalizedCampuses.length !== campuses.length || normalizedCampuses.length < 1 || normalizedCampuses.length > AD_TARGET_CAMPUSES.length || normalizedCampuses.some((item) => typeof item !== 'string' || !AD_TARGET_CAMPUSES.includes(item as typeof AD_TARGET_CAMPUSES[number])) ||
      normalizedCampuses.includes('All Tanzania Campuses') && normalizedCampuses.length > 1 ||
      campaignTitle.length < 3 || campaignTitle.length > 160 || campaignDetails.length < 10 || campaignDetails.length > 3000 ||
      !creativeUrl || destinationUrl === null || !/^[A-Z0-9-]{5,40}$/.test(transactionReference) || !/^[0-9a-f-]{36}$/i.test(paymentMethodId)) {
    return NextResponse.json({ error: 'Check the business details, campaign creative/link, payment reference, and selected package.' }, { status: 400 });
  }
  const { data: method, error: methodError } = await supabase.from('payment_settings').select('id').eq('id', paymentMethodId).eq('is_active', true).maybeSingle();
  if (methodError) return NextResponse.json({ error: 'Payment methods are temporarily unavailable.' }, { status: 503 });
  if (!method) return NextResponse.json({ error: 'Select an active payment method.' }, { status: 400 });

  const amountDue = getAdvertisingFee(packageType as SelfServeAdPackage, durationWeeks);
  const { data, error } = await supabase.from('advertising_inquiries').insert({
    business_name: businessName,
    contact_person: contactPerson,
    phone,
    email,
    target_campuses: normalizedCampuses,
    package_type: packageType,
    campaign_title: campaignTitle,
    creative_url: creativeUrl,
    destination_url: destinationUrl,
    duration_weeks: durationWeeks,
    budget: String(amountDue),
    notes: campaignDetails,
    amount_due: amountDue,
    payment_method_id: paymentMethodId,
    transaction_reference: transactionReference,
    payment_status: 'Submitted',
    campaign_status: 'Draft',
    status: 'Pending Payment Verification',
  }).select('id,amount_due,payment_status,status').single();
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'That transaction reference has already been submitted.' }, { status: 409 });
    return NextResponse.json({ error: 'Could not submit the campaign. Confirm the latest advertising migration is applied.' }, { status: 503 });
  }
  return NextResponse.json({ success: true, application: data }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
