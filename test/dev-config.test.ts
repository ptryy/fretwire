import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  isDevConfigEnabled,
  isUnlocked,
  isValidToken,
  requiresUnlock,
  unlockCookieValue,
} from '@/lib/dev-config';
import {
  getConfigView,
  getPaymentsConfig,
  withSecretsKeptUnlessRetyped,
} from '@/lib/payments/config';
import { getStore } from '@/lib/store';

/** Stand in for a deployed build — vitest otherwise runs with NODE_ENV=test. */
function deployed(token?: string) {
  vi.stubEnv('NODE_ENV', 'production');
  if (token !== undefined) vi.stubEnv('DEV_CONFIG_TOKEN', token);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('dev-config gate', () => {
  it('is open in local dev without a token', () => {
    expect(isDevConfigEnabled()).toBe(true);
    expect(requiresUnlock()).toBe(false);
    expect(isUnlocked(undefined)).toBe(true);
  });

  it('stays shut on a deployed build with no token — the default posture', () => {
    deployed('');
    expect(isDevConfigEnabled()).toBe(false);
  });

  it('opens on a deployed build once a token is set, but demands an unlock', () => {
    deployed('s3cret-token');
    expect(isDevConfigEnabled()).toBe(true);
    expect(requiresUnlock()).toBe(true);
    expect(isUnlocked(undefined)).toBe(false);
  });
});

describe('dev-config unlock', () => {
  it('accepts the token and rejects near-misses', () => {
    deployed('s3cret-token');
    expect(isValidToken('s3cret-token')).toBe(true);
    expect(isValidToken('s3cret-toke')).toBe(false);
    expect(isValidToken('S3cret-token')).toBe(false);
    expect(isValidToken('')).toBe(false);
  });

  it('never accepts any token when none is configured', () => {
    deployed('');
    expect(isValidToken('')).toBe(false);
    expect(isValidToken('anything')).toBe(false);
  });

  it('honours the cookie it issued, and nothing else', () => {
    deployed('s3cret-token');
    expect(isUnlocked(unlockCookieValue())).toBe(true);
    expect(isUnlocked('s3cret-token')).toBe(false); // the raw token is not the cookie
    expect(isUnlocked('deadbeef')).toBe(false);
  });
});

describe('config view redaction', () => {
  it('reports secrets as set without ever returning them', async () => {
    await getStore().setConfig({
      privateKey: 'sk-live-abcd1234',
      ipnSecret: 'ipn-wxyz9876',
      apiUrl: 'https://gw.test',
    });
    const view = await getConfigView();

    expect(view.fields.privateKey.value).toBe('');
    expect(view.fields.ipnSecret.value).toBe('');
    expect(view.fields.privateKey.hint).toBe('••••1234');
    expect(view.fields.ipnSecret.hint).toBe('••••9876');

    // Belt and braces: no secret may appear anywhere in the serialized payload.
    const wire = JSON.stringify(view);
    expect(wire).not.toContain('sk-live-abcd1234');
    expect(wire).not.toContain('ipn-wxyz9876');

    // Non-secret fields still come back in full.
    expect(view.fields.apiUrl.value).toBe('https://gw.test');
  });

  it('flags an in-memory store as non-persistent', async () => {
    expect((await getConfigView()).persistent).toBe(false);
  });
});

describe('saving without retyping a secret', () => {
  it('keeps a stored secret when the field comes back blank', () => {
    const patch = withSecretsKeptUnlessRetyped({
      apiUrl: 'https://new.test',
      privateKey: '',
      ipnSecret: '   ',
    });
    expect(patch).not.toHaveProperty('privateKey');
    expect(patch).not.toHaveProperty('ipnSecret');
    expect(patch.apiUrl).toBe('https://new.test');
  });

  it('still overwrites a secret that was retyped', () => {
    expect(withSecretsKeptUnlessRetyped({ privateKey: 'sk-2' }).privateKey).toBe('sk-2');
  });

  it('leaves an empty non-secret alone, so it falls back to env', () => {
    expect(withSecretsKeptUnlessRetyped({ apiUrl: '' }).apiUrl).toBe('');
  });

  // The regression this guards: a key injected via /dev/config (env has none)
  // must survive an unrelated edit. Without this rule the blank secret field
  // would clear the override, and http checkout would start failing again.
  it('survives an unrelated edit end to end', async () => {
    await getStore().clearConfig();
    await getStore().setConfig(withSecretsKeptUnlessRetyped({ privateKey: 'sk-injected' }));
    await getStore().setConfig(
      withSecretsKeptUnlessRetyped({ apiUrl: 'https://gw2.test', privateKey: '' }),
    );

    const cfg = await getPaymentsConfig();
    expect(cfg.privateKey).toBe('sk-injected');
    expect(cfg.apiUrl).toBe('https://gw2.test');
  });
});
