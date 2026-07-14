import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Access control for the runtime gateway-config editor (`/dev/config`).
 *
 * The editor is a portable escape hatch: it lets an operator repoint the gateway
 * or inject a key on a *running* deploy, whatever the host. That is exactly the
 * capability an attacker wants, so it is fail-closed — a deployed build only
 * serves it when `DEV_CONFIG_TOKEN` is set, and only to a caller that proved it
 * knows the token. No token → the routes 404, as if the feature did not exist.
 *
 * The token is the entire security boundary and there is no rate limit on the
 * unlock attempt: use a high-entropy random value (32+ chars), never a word.
 *
 * Every read here is at call time, never at module scope. Under OpenNext the
 * Worker's env is only copied onto `process.env` once a request is in flight, so
 * a module-level `process.env.X` would evaluate empty and the route would 404
 * *with the token set*.
 */

export const DEV_CONFIG_COOKIE = 'fw_dev_config';

function token(): string {
  return (process.env.DEV_CONFIG_TOKEN ?? '').trim();
}

/** A deployed build; local `next dev` / `wrangler dev` is treated as trusted. */
function isDeployed(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** Open locally; on a deployed build only once `DEV_CONFIG_TOKEN` is configured. */
export function isDevConfigEnabled(): boolean {
  return !isDeployed() || token() !== '';
}

/** Local dev needs no unlock; a deployed build always does. */
export function requiresUnlock(): boolean {
  return isDeployed();
}

function equals(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** What the unlock cookie carries — a digest, so the raw token is never echoed back. */
function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Constant-time check of a token the operator typed into the unlock form. */
export function isValidToken(candidate: string): boolean {
  const expected = token();
  return expected !== '' && equals(candidate, expected);
}

/** The cookie value to hand back once a token checks out. */
export function unlockCookieValue(): string {
  return digest(token());
}

/** Whether a request carrying this cookie may read/write the config. */
export function isUnlocked(cookie: string | undefined): boolean {
  if (!requiresUnlock()) return true;
  if (!cookie) return false;
  return equals(cookie, digest(token()));
}
