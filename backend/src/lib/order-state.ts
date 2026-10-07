export type FulfillmentStatus = 'pending' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

const fulfillmentTransitions: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['dispatched', 'cancelled'],
  dispatched: ['delivered'],
  delivered: [],
  cancelled: []
};

export function canChangeFulfillment(
  current: FulfillmentStatus,
  next: FulfillmentStatus,
  paymentStatus: PaymentStatus
): boolean {
  if (current === next) return true;
  if (next === 'cancelled' && paymentStatus === 'paid') return false;
  if (['processing', 'dispatched', 'delivered'].includes(next) && paymentStatus !== 'paid') return false;
  return fulfillmentTransitions[current].includes(next);
}
