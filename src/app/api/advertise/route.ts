import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  let body: {
    businessName?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    targetCampuses?: string[];
    packageType?: string;
    budget?: string;
    campaignDetails?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid advertising booking payload.' }, { status: 400 });
  }

  if (!body.businessName?.trim() || !body.phone?.trim()) {
    return NextResponse.json({ error: 'Business name and WhatsApp phone number are required.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      await supabase.from('advertising_inquiries').insert({
        business_name: body.businessName.trim(),
        contact_person: body.contactPerson?.trim() || '',
        phone: body.phone.trim(),
        email: body.email?.trim() || '',
        target_campuses: body.targetCampuses || [],
        package_type: body.packageType || 'Homepage Spotlight',
        budget: body.budget || '',
        notes: body.campaignDetails || '',
        created_at: new Date().toISOString(),
      });
    } catch {
      // Table may not exist yet, allow graceful fallback
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Your advertising inquiry was received! UniSoko ad partnerships will contact you within 24 hours.',
  });
}
