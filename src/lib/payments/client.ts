import { env } from '../env';

import { HttpClient } from './http-client';
import { MockClient } from './mock-client';
import type { NextPaymentsClient } from './types';

/** Pick the gateway client implementation from `PAYMENTS_MODE`. */
export function getClient(): NextPaymentsClient {
  return env.mode === 'http' ? new HttpClient() : new MockClient();
}
