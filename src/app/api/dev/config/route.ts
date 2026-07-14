import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { DEV_CONFIG_COOKIE, isDevConfigEnabled, isUnlocked } from '@/lib/dev-config';
import { getConfigView, withSecretsKeptUnlessRetyped } from '@/lib/payments/config';
import { getStore } from '@/lib/store';

/**
 * Runtime override for the gateway config, backing `/dev/config`. Lets an operator
 * repoint the gateway or inject a key on a *running* deploy — any host, no rebuild.
 * Writes a partial override into the Store; the request path reads it back through
 * `getPaymentsConfig` (Store over env).
 *
 * Guarded by `DEV_CONFIG_TOKEN` (see `@/lib/dev-config`): a build without one 404s
 * here, so the default posture is "feature absent". GET never returns a credential
 * — only `getConfigView`'s redacted shape.
 */

export const dynamic = 'force-dynamic';

const overrideSchema = z.object({
  mode: z.union([z.literal('mock'), z.literal('http')]).optional(),
  apiUrl: z.string().optional(),
  publicKey: z.string().optional(),
  privateKey: z.string().optional(),
  ipnSecret: z.string().optional(),
  appUrl: z.string().optional(),
});

/** 404 when the feature is off; 401 when it's on but the caller hasn't unlocked. */
async function refuse(): Promise<Response | null> {
  if (!isDevConfigEnabled()) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const jar = await cookies();
  if (!isUnlocked(jar.get(DEV_CONFIG_COOKIE)?.value)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET(): Promise<Response> {
  return (await refuse()) ?? NextResponse.json(await getConfigView());
}

export async function POST(req: Request): Promise<Response> {
  const refused = await refuse();
  if (refused) return refused;

  const body: unknown = await req.json().catch(() => null);
  const parsed = overrideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  // A blank secret means "keep what's stored" — enforced server-side, so no
  // caller can wipe an injected key just by saving an unrelated field.
  await getStore().setConfig(withSecretsKeptUnlessRetyped(parsed.data));
  return NextResponse.json({ ok: true, ...(await getConfigView()) });
}

/** Drop the override entirely — every field falls back to env. */
export async function DELETE(): Promise<Response> {
  const refused = await refuse();
  if (refused) return refused;

  await getStore().clearConfig();
  return NextResponse.json({ ok: true, ...(await getConfigView()) });
}
