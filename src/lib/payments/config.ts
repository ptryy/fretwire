import { env } from '../env';
import { getStore, isPersistentStore } from '../store';

import {
  CONFIG_FIELDS,
  PAYMENTS_MODES,
  SECRET_CONFIG_FIELDS,
  isSecretField,
  type ConfigField,
  type ConfigFieldView,
  type ConfigSource,
  type ConfigView,
  type PaymentsConfigOverride,
  type PaymentsMode,
  type ResolvedPaymentsConfig,
} from './types';

/**
 * Single source of gateway config for the request path. The env is the base;
 * a dev-only Store override (see `/dev/config`) is layered on top — a non-empty
 * override field wins, an empty/absent one falls back to env. `getClient`, the
 * IPN route, and the status/simulate routes all read through here so the
 * override applies everywhere at once.
 */

export type { ConfigField, ConfigSource };

function envBase(): ResolvedPaymentsConfig {
  return {
    mode: env.mode,
    apiUrl: env.apiUrl,
    publicKey: env.publicKey,
    privateKey: env.privateKey,
    ipnSecret: env.ipnSecret,
    appUrl: env.appUrl,
  };
}

function isMode(value: unknown): value is PaymentsMode {
  return typeof value === 'string' && (PAYMENTS_MODES as readonly string[]).includes(value);
}

async function resolve(): Promise<{
  effective: ResolvedPaymentsConfig;
  sources: Record<ConfigField, ConfigSource>;
}> {
  const effective = envBase();
  const sources = Object.fromEntries(CONFIG_FIELDS.map((k) => [k, 'env'])) as Record<
    ConfigField,
    ConfigSource
  >;
  const override = await getStore().getConfig();
  if (!override) return { effective, sources };

  if (isMode(override.mode)) {
    effective.mode = override.mode;
    sources.mode = 'override';
  }
  for (const key of ['apiUrl', 'publicKey', 'privateKey', 'ipnSecret', 'appUrl'] as const) {
    const value = override[key];
    if (typeof value === 'string' && value.trim() !== '') {
      effective[key] = value;
      sources[key] = 'override';
    }
  }
  return { effective, sources };
}

/** Fully-resolved config (env base + Store override). Store wins per field. */
export async function getPaymentsConfig(): Promise<ResolvedPaymentsConfig> {
  return (await resolve()).effective;
}

/** Effective config plus where each field came from. Server-only — holds secrets. */
export async function getConfigWithSources(): Promise<{
  effective: ResolvedPaymentsConfig;
  sources: Record<ConfigField, ConfigSource>;
}> {
  return resolve();
}

/**
 * An empty *secret* in a patch means "leave it alone", never "clear it". The
 * config editor renders secrets blank because they're write-only, so otherwise
 * every save that didn't retype the private key would wipe it — fatal for the
 * main use case, which is injecting a key the env doesn't have. Clearing is
 * `clearConfig()`'s job.
 *
 * Empty *non-secret* fields keep their meaning: fall back to env.
 */
export function withSecretsKeptUnlessRetyped(
  patch: PaymentsConfigOverride,
): PaymentsConfigOverride {
  const next = { ...patch };
  for (const field of SECRET_CONFIG_FIELDS) {
    if (next[field]?.trim() === '') delete next[field];
  }
  return next;
}

/** `'••••1a2b'` — enough to tell two keys apart, not enough to use one. */
function hint(value: string): string {
  return value === '' ? '' : `••••${value.slice(-4)}`;
}

/**
 * The only shape `/dev/config` is allowed to see. Credentials are write-only:
 * their value never leaves the server, just a last-4 hint of whether one is set.
 * Everything the editor renders comes from here, so a redaction bug can't hide
 * behind a second, unredacted read path.
 */
export async function getConfigView(): Promise<ConfigView> {
  const { effective, sources } = await resolve();
  const entries = CONFIG_FIELDS.map((field): [ConfigField, ConfigFieldView] => {
    const value = effective[field];
    const secret = isSecretField(field);
    return [
      field,
      {
        source: sources[field],
        secret,
        value: secret ? '' : value,
        hint: secret ? hint(value) : '',
      },
    ];
  });
  return {
    fields: Object.fromEntries(entries) as Record<ConfigField, ConfigFieldView>,
    persistent: isPersistentStore(),
  };
}

/** Assert the http-path credentials are present; throws a clear error if not. */
export function requireHttpConfig(cfg: ResolvedPaymentsConfig): {
  apiUrl: string;
  publicKey: string;
  privateKey: string;
} {
  const missing = (['apiUrl', 'publicKey', 'privateKey'] as const).filter((k) => !cfg[k]);
  if (missing.length > 0) {
    throw new Error(`Missing gateway config: ${missing.join(', ')}`);
  }
  return { apiUrl: cfg.apiUrl, publicKey: cfg.publicKey, privateKey: cfg.privateKey };
}
