import { jwtVerify, SignJWT } from 'jose';
import { sessionKey } from './keys';

// What the tool remembers about a Canvas launch. It's handed to the browser as a signed token
// (kept in sessionStorage, not a cookie, because Canvas runs tools in a third-party iframe).
export type LtiSession = {
  userId: string;
  name?: string;
  roles: string[];
  issuer: string;
  clientId: string;
  deploymentId: string;
  contextId?: string;
  contextTitle?: string;
  resourceLinkId?: string;
  // Section this launch is for, e.g. "finite-state-machines/dfas"
  sectionKey?: string;
  // Assignment and Grade Services: where to post scores, and which scopes Canvas granted
  lineItem?: string;
  agsScopes: string[];
  deepLink?: { returnUrl: string; data?: string };
};

const SESSION_AUDIENCE = 'pumping-llama/session';
const STATE_AUDIENCE = 'pumping-llama/oidc-state';

export async function signSession(session: LtiSession): Promise<string> {
  return new SignJWT({ session })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(sessionKey());
}

export async function verifySession(token: string | null | undefined): Promise<LtiSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey(), { audience: SESSION_AUDIENCE, algorithms: ['HS256'] });
    return payload.session as LtiSession;
  } catch {
    return null;
  }
}

export type OidcState = { stateId: string; nonce: string };

// The OIDC state parameter is itself signed, so the launch can be checked even when the
// browser blocks the third-party state cookie
export async function signState(state: OidcState): Promise<string> {
  return new SignJWT({ ...state })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(STATE_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(sessionKey());
}

export async function verifyState(token: string): Promise<OidcState | null> {
  try {
    const { payload } = await jwtVerify(token, sessionKey(), { audience: STATE_AUDIENCE, algorithms: ['HS256'] });
    if (typeof payload.stateId !== 'string' || typeof payload.nonce !== 'string') return null;
    return { stateId: payload.stateId, nonce: payload.nonce };
  } catch {
    return null;
  }
}

// Nonces seen in the last few minutes. In-memory, so replay protection is per server
// instance; swap in a shared store (Redis, KV) when running several instances.
const seenNonces = new Map<string, number>();

export function consumeNonce(nonce: string): boolean {
  const now = Date.now();
  for (const [n, expires] of seenNonces) if (expires < now) seenNonces.delete(n);
  if (seenNonces.has(nonce)) return false;
  seenNonces.set(nonce, now + 15 * 60 * 1000);
  return true;
}

export const bearerToken = (request: Request) =>
  request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
