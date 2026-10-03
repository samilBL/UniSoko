import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  let body: {
    orderId?: string;
    buyerName?: string;
    buyerPhone?: string;
    claimType?: string;
    description?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const validClaimTypes = ['Warranty', 'Return', 'Damaged', 'Wrong item'];

  if (
    !body.orderId || typeof body.orderId !== 'string' || body.orderId.trim().length < 3 ||
    !body.buyerName || typeof body.buyerName !== 'string' || body.buyerName.trim().length < 2 ||
    !body.buyerPhone || typeof body.buyerPhone !== 'string' || body.buyerPhone.trim().length < 5 ||
    !body.claimType || !validClaimTypes.includes(body.claimType) ||
    !body.description || typeof body.description !== 'string' || body.description.trim().length < 5
  ) {
    return NextResponse.json(
      { error: 'Please provide valid order ID, name, phone, claim type, and issue description.' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      success: true,
      claim: {
        id: `mock-claim-${Date.now()}`,
        order_id: body.orderId.trim(),
        claim_type: body.claimType,
        status: 'Submitted',
        submitted_at: new Date().toISOString()
      },
      message: 'Warranty / Return claim submitted! We will inspect and contact you within 24 hours.'
    });
  }

  const newClaim = {
    order_id: body.orderId.trim(),
    buyer_name: body.buyerName.trim().slice(0, 200),
    buyer_phone: body.buyerPhone.trim().slice(0, 30),
    claim_type: body.claimType,
    description: body.description.trim().slice(0, 2000),
    status: 'Submitted',
    admin_notes: '',
  };

  const { data, error } = await supabase
    .from('warranty_claims')
    .insert(newClaim)
    .select()
    .single();

  if (error || !data) {
    console.error('Warranty claim error:', error);
    return NextResponse.json({ error: 'Failed to submit warranty claim. Please verify your Order ID and try again.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    claim: data,
    message: 'Claim recorded! Our quality team will contact you for device inspection or drop-off.'
  }, { status: 201 });
}
