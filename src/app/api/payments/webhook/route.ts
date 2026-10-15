import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Automated Payment Webhook Handler (ClickPesa, Selcom, Mobile Money API)
 * Ready for automated payment verification callbacks as UniSoko scales.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      orderId?: string;
      reference?: string;
      transactionId?: string;
      status?: string;
      amount?: number;
      signature?: string;
    };

    const orderId = body.orderId || body.reference;
    const txId = body.transactionId || body.reference || 'GATEWAY-AUTO';
    const isSuccess = body.status === 'SUCCESS' || body.status === 'COMPLETED' || body.status === 'PAID';

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId or reference' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ message: 'Webhook received (mock mode)', orderId, status: isSuccess ? 'Verified' : 'Pending' });
    }

    if (isSuccess) {
      // Transition payment status to Verified
      const { data, error } = await supabase.rpc('transition_order_status', {
        target_order_id: orderId,
        next_status_type: 'payment',
        next_status: 'Verified',
      });

      if (error) {
        console.error('Webhook error transitioning order status:', error);
      }

      // Update txId if provided
      if (txId) {
        await supabase.from('orders').update({ lipa_namba_tx_id: txId }).eq('id', orderId);
      }
    }

    return NextResponse.json({ received: true, orderId, processed: isSuccess });
  } catch (err) {
    console.error('Payment webhook error:', err);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
