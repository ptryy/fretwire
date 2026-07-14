import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  DEV_CONFIG_COOKIE,
  isDevConfigEnabled,
  isValidToken,
  unlockCookieValue,
} from '@/lib/dev-config';

/**
 * Exchanges the `DEV_CONFIG_TOKEN` for the cookie that `/dev/config` and its API
 * require. Same 404-when-disabled posture as the config route, so probing this
 * path can't reveal that the feature exists.
 */

export const dynamic = 'force-dynamic';

const bodySchema = z.object({ token: z.string() });

export async function POST(req: Request): Promise<Response> {
  if (!isDevConfigEnabled()) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success || !isValidToken(parsed.data.token)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(DEV_CONFIG_COOKIE, unlockCookieValue(), {
    httpOnly: true,
    sameSite: 'strict',
    // Derived from the request, not hardcoded: a `secure` cookie is dropped over
    // http, which is what `wrangler dev` (localhost:8787) serves.
    secure: new URL(req.url).protocol === 'https:',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return res;
}
