import { getStore } from './index';

/** Strictly-increasing per-publicKey nonce for HMAC request signing. */
export async function nextNonce(publicKey: string): Promise<number> {
  return getStore().nextNonce(publicKey);
}
