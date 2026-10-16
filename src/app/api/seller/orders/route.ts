import { NextResponse } from 'next/server';
import { getSellerActor, getSellerProfile } from '@/lib/sellerAuth';
import type { Order, OrderItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const actor = await getSellerActor();
  if (actor.kind === 'unavailable') return NextResponse.json({ error: 'Seller order tracking is not configured.' }, { status: 503 });
  if (actor.kind !== 'ok') return NextResponse.json({ error: 'Sign in through the seller portal.' }, { status: 401 });

  const { data: seller, error: sellerError } = await getSellerProfile(actor.serviceClient, actor.user.id);
  if (sellerError) return NextResponse.json({ error: 'Could not load your seller account.' }, { status: 503 });
  if (!seller || seller.status !== 'approved') return NextResponse.json({ error: 'An approved seller account is required.' }, { status: 403 });

  const { data: sellerItems, error: itemsError } = await actor.serviceClient.from('order_items')
    .select('order_id,product_id,product_title,condition,quantity,unit_price,line_total')
    .eq('seller_profile_id', seller.id)
    .order('created_at', { ascending: false })
    .limit(200);
  if (itemsError) return NextResponse.json({ error: 'Seller order tracking is unavailable. Apply the Phase 2 seller portal migration.' }, { status: 503 });
  const orderIds = [...new Set((sellerItems || []).map((item) => item.order_id))];
  if (!orderIds.length) return NextResponse.json({ orders: [] }, { headers: { 'Cache-Control': 'no-store' } });

  const { data: orderRows, error: ordersError } = await actor.serviceClient.from('orders')
    .select('id,product_id,product_title,buyer_name,buyer_phone,university,delivery_spot_type,delivery_details,quantity,total_amount,status,payment_status,fulfillment_status,delivery_status,dispatch_assignee_type,dispatch_assignee_id,dispatch_assignee_name,dispatch_assigned_at,created_at')
    .in('id', orderIds)
    .order('created_at', { ascending: false });
  if (ordersError) return NextResponse.json({ error: 'Could not load seller order statuses.' }, { status: 503 });

  const orders: Order[] = (orderRows || []).map((row) => {
    const items: OrderItem[] = (sellerItems || []).filter((item) => item.order_id === row.id).map((item) => ({
      productId: item.product_id,
      productTitle: item.product_title,
      condition: item.condition as OrderItem['condition'],
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      lineTotal: Number(item.line_total),
      sellerProfileId: seller.id,
    }));
    return {
      id: row.id,
      productId: items[0]?.productId || '',
      productTitle: items.map((item) => `${item.quantity}x ${item.productTitle}`).join(', '),
      buyerName: row.buyer_name,
      buyerPhone: row.buyer_phone,
      university: row.university,
      deliverySpotType: row.delivery_spot_type as Order['deliverySpotType'],
      deliveryDetails: row.delivery_details,
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      items,
      totalAmount: items.reduce((sum, item) => sum + item.lineTotal, 0),
      lipaNambaTxId: '',
      status: row.status as Order['status'],
      paymentStatus: row.payment_status as Order['paymentStatus'],
      fulfillmentStatus: row.fulfillment_status as Order['fulfillmentStatus'],
      deliveryStatus: row.delivery_status as Order['deliveryStatus'],
      dispatchAssigneeType: row.dispatch_assignee_type as Order['dispatchAssigneeType'],
      dispatchAssigneeId: row.dispatch_assignee_id || undefined,
      dispatchAssigneeName: row.dispatch_assignee_name || undefined,
      dispatchAssignedAt: row.dispatch_assigned_at || undefined,
      createdAt: row.created_at,
    };
  });

  return NextResponse.json({ orders }, { headers: { 'Cache-Control': 'no-store' } });
}
