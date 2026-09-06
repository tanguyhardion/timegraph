import { createHmac, timingSafeEqual } from 'crypto';

const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'horology1815';

function getSecretKey(): string {
  return process.env.AUTH_SECRET || process.env.MASTER_PASSWORD || 'timegraph-horology-salt-2026';
}

/**
 * Creates an HMAC signature token for the authenticated session.
 * Token structure: payload.signature
 * payload is timestamp_millis
 */
export function createSessionToken(): string {
  const timestamp = Date.now().toString();
  const secret = getSecretKey();
  const hmac = createHmac('sha256', secret);
  hmac.update(`timegraph_auth:${timestamp}`);
  const signature = hmac.digest('hex');
  return `${timestamp}.${signature}`;
}

/**
 * Validates the session token.
 * Max token lifetime: 24 hours (for active session).
 */
export function verifySessionToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestampStr, providedSignature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Max session lifetime window (24 hours)
  const maxAge = 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAge || timestamp > Date.now() + 60000) {
    return false;
  }

  const secret = getSecretKey();
  const hmac = createHmac('sha256', secret);
  hmac.update(`timegraph_auth:${timestampStr}`);
  const expectedSignature = hmac.digest('hex');

  try {
    const providedBuffer = Buffer.from(providedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    if (providedBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(providedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Timing-safe password check
 */
export function verifyMasterPassword(provided: string): boolean {
  if (typeof provided !== 'string') return false;

  const expected = process.env.MASTER_PASSWORD || 'horology1815';
  
  // Pad strings to same length buffer for constant-time comparison
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    // Still perform dummy timing safe equal to prevent timing leaks
    timingSafeEqual(expectedBuffer, expectedBuffer);
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}
