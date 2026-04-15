import crypto from 'crypto';

/**
 * Signed token for notify-back unsubscribe links. Format:
 *   <urlsafe-base64(payload)>.<urlsafe-base64(hmac)>
 * Payload encodes `{e,p}` (email, projectId). HMAC is sha256 over the raw
 * payload using `WEBHOOK_SECRET_KEY` (re-uses the existing 32-byte secret —
 * no new env var to provision).
 *
 * The token is bound to (email, projectId) so it can only suppress mail to
 * that recipient on that project. No expiry — RFC 8058 implies a stable
 * one-click URL across the lifetime of the recipient's relationship with
 * the sender, and rotating these would invalidate existing emails.
 */
const ALGO = 'sha256';
// Domain separator — keeps this signing surface isolated from any other use
// of WEBHOOK_SECRET_KEY. Bumping the version invalidates outstanding tokens.
const DOMAIN = 'suppress:v1|';

function getKey(): Buffer {
  const hex = process.env.WEBHOOK_SECRET_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('WEBHOOK_SECRET_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, 'base64');
}

export function signSuppressionToken(email: string, projectId: string): string {
  const payload = JSON.stringify({ e: email, p: projectId });
  const payloadB64 = b64url(payload);
  const mac = crypto
    .createHmac(ALGO, getKey())
    .update(DOMAIN + payloadB64)
    .digest();
  return `${payloadB64}.${b64url(mac)}`;
}

export function verifySuppressionToken(token: string): { email: string; projectId: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, macB64] = parts;
  const expectedMac = crypto
    .createHmac(ALGO, getKey())
    .update(DOMAIN + payloadB64)
    .digest();
  let providedMac: Buffer;
  try {
    providedMac = b64urlDecode(macB64);
  } catch {
    return null;
  }
  if (
    providedMac.length !== expectedMac.length ||
    !crypto.timingSafeEqual(providedMac, expectedMac)
  ) {
    return null;
  }
  try {
    const payloadJson = b64urlDecode(payloadB64).toString('utf8');
    const payload = JSON.parse(payloadJson) as { e?: unknown; p?: unknown };
    if (typeof payload.e !== 'string' || typeof payload.p !== 'string') return null;
    return { email: payload.e, projectId: payload.p };
  } catch {
    return null;
  }
}
