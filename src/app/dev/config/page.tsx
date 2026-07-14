import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { DevConfigForm } from '@/components/dev-config-form';
import { DevConfigUnlock } from '@/components/dev-config-unlock';
import { DEV_CONFIG_COOKIE, isDevConfigEnabled, isUnlocked } from '@/lib/dev-config';
import { getConfigView } from '@/lib/payments/config';

export const metadata: Metadata = { title: 'Dev · Config', robots: { index: false } };

/** Reads cookies + env per request — must never be prerendered at build time. */
export const dynamic = 'force-dynamic';

/**
 * Runtime gateway-config editor. Open in local dev; on a deployed build it exists
 * only when `DEV_CONFIG_TOKEN` is set, and then only behind the unlock form.
 */
export default async function DevConfigPage() {
  if (!isDevConfigEnabled()) notFound();

  const jar = await cookies();
  const unlocked = isUnlocked(jar.get(DEV_CONFIG_COOKIE)?.value);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      {unlocked ? <DevConfigForm initialView={await getConfigView()} /> : <DevConfigUnlock />}
    </main>
  );
}
