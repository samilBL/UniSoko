import type { DeliveryStatus, FulfillmentStatus, Order, PaymentStatus } from '@/lib/types';

export type OrderStatusType = 'payment' | 'fulfillment' | 'delivery';

export const ORDER_STATUS_LABELS: Record<OrderStatusType, readonly string[]> = {
  payment: ['Submitted', 'Verification', 'Verified', 'Failed'],
  fulfillment: ['Unconfirmed', 'Confirmed', 'Preparing', 'Ready for Dispatch'],
  delivery: ['Not Dispatched', 'With Winga', 'With Courier', 'Ready for Pickup', 'Delivered'],
};

export function getLegacyOrderStatus(order: Pick<Order, 'status' | 'paymentStatus' | 'fulfillmentStatus' | 'deliveryStatus'>) {
  if (order.deliveryStatus === 'Delivered') return 'Completed';
  if (order.deliveryStatus && order.deliveryStatus !== 'Not Dispatched') return 'Out for Delivery';
  if (order.paymentStatus && order.paymentStatus !== 'Verified') return 'Pending Verification';
  return order.status;
}

export function getNextOrderAction(order: Pick<Order, 'status' | 'paymentStatus' | 'fulfillmentStatus' | 'deliveryStatus' | 'deliverySpotType'>) {
  const legacyStatus = 'status' in order ? order.status : undefined;
  const paymentStatus: PaymentStatus = order.paymentStatus || (legacyStatus === 'Pending Verification' ? 'Submitted' : 'Verified');
  const fulfillmentStatus: FulfillmentStatus = order.fulfillmentStatus || (legacyStatus === 'Pending Verification' ? 'Unconfirmed' : legacyStatus === 'Approved' ? 'Confirmed' : 'Ready for Dispatch');
  const deliveryStatus: DeliveryStatus = order.deliveryStatus || (
    legacyStatus === 'Completed' ? 'Delivered' :
      legacyStatus === 'Out for Delivery' ? order.deliverySpotType === 'Courier' ? 'With Courier' : 'With Winga' :
        'Not Dispatched'
  );

  if (paymentStatus === 'Submitted') return { type: 'payment' as const, status: 'Verification' };
  if (paymentStatus === 'Verification') return { type: 'payment' as const, status: 'Verified' };
  if (paymentStatus !== 'Verified') return null;
  if (fulfillmentStatus === 'Confirmed') return { type: 'fulfillment' as const, status: 'Preparing' };
  if (fulfillmentStatus === 'Preparing') return { type: 'fulfillment' as const, status: 'Ready for Dispatch' };
  if (fulfillmentStatus !== 'Ready for Dispatch') return null;
  if (deliveryStatus === 'Not Dispatched') {
    return {
      type: 'delivery' as const,
      status: order.deliverySpotType === 'Courier' ? 'With Courier' : 'With Winga',
    };
  }
  if (deliveryStatus === 'With Winga' || deliveryStatus === 'With Courier') {
    return { type: 'delivery' as const, status: 'Ready for Pickup' };
  }
  if (deliveryStatus === 'Ready for Pickup') return { type: 'delivery' as const, status: 'Delivered' };
  return null;
}