import { getStore } from './index';

/** Record an IPN delivery id; returns false if it was already processed. */
export async function markDelivered(deliveryId: string): Promise<boolean> {
  return getStore().markDelivered(deliveryId);
}
