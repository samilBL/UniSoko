import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  let body: {
    orderId?: string;
    buyerName?: string;
    buyerPhone?: string;
    subject?: string;
    message?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const validSubjects = [
    'Payment', 'Delivery', 'Wrong product', 'Damaged product',
    'Warranty', 'Return', 'Cancellation', 'Other'
  ];

  if (
    !body.buyerName || typeof body.buyerName !== 'string' || body.buyerName.trim().length < 2 ||
    !body.buyerPhone || typeof body.buyerPhone !== 'string' || body.buyerPhone.trim().length < 5 ||
    !body.subject || !validSubjects.includes(body.subject) ||
    !body.message || typeof body.message !== 'string' || body.message.trim().length < 5
  ) {
    return NextResponse.json(
      { error: 'Please fill in all required fields properly (name, phone, subject, message).' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    // Return mock success if DB not connected
    return NextResponse.json({
      success: true,
      ticket: {
        id: `mock-${Date.now()}`,
        buyer_name: body.buyerName.trim(),
        subject: body.subject,
        status: 'Open',
        created_at: new Date().toISOString()
      },
      message: 'Support request received! Our student success team will reach out via WhatsApp/Call.'
    });
  }

  const newTicket = {
    order_id: body.orderId?.trim() ? body.orderId.trim() : null,
    buyer_name: body.buyerName.trim().slice(0, 200),
    buyer_phone: body.buyerPhone.trim().slice(0, 30),
    subject: body.subject,
    message: body.message.trim().slice(0, 2000),
    status: 'Open',
    admin_notes: '',
  };

  const { data, error } = await supabase
    .from('support_tickets')
    .insert(newTicket)
    .select()
    .single();

  if (error || !data) {
    console.error('Support ticket error:', error);
    return NextResponse.json({ error: 'Failed to submit support request. Please try again or WhatsApp us directly.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    ticket: data,
    message: 'Support ticket submitted successfully! A UniSoko agent will reach out shortly.'
  }, { status: 201 });
}
