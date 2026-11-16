import { jwtVerify, SignJWT } from 'jose';
import { sessionKey } from '@/lib/lti/keys';

// "Log in with Canvas" for students who open the site directly (not through an LTI launch).
// Uses Canvas's OAuth2 web flow with a Canvas *API* developer key, which is separate from the
// LTI key. Canvas returns the user's id and name with the token, so no API scopes are needed;
// the access token is revoked as soon as the login finishes.

export type CanvasOAuthConfig = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
};

export function getCanvasOAuth(): CanvasOAuthConfig | null {
  const baseUrl = process.env.CANVAS_URL;
  const clientId = process.env.CANVAS_OAUTH_CLIENT_ID;
  const clientSecret = process.env.CANVAS_OAUTH_CLIENT_SECRET;
  if (!baseUrl || !clientId || !clientSecret) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ''), clientId, clientSecret };
}

export type CanvasUser = {
  id: string;
  name: string;
  // Canvas instance the user signed in to
  canvasUrl: string;
};

export const USER_COOKIE = 'pl_canvas_user';
export const STATE_COOKIE = 'pl_canvas_oauth';

const USER_AUDIENCE = 'pumping-llama/canvas-user';
const STATE_AUDIENCE = 'pumping-llama/canvas-oauth-state';
export const USER_MAX_AGE = 60 * 60 * 24 * 14; // two weeks

export async function signUser(user: CanvasUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(USER_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${USER_MAX_AGE}s`)
    .sign(sessionKey());
}

export async function verifyUser(token: string | null | undefined): Promise<CanvasUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey(), { audience: USER_AUDIENCE, algorithms: ['HS256'] });
    return payload.user as CanvasUser;
  } catch {
    return null;
  }
}

export type OAuthState = { stateId: string; returnTo: string };

export async function signOAuthState(state: OAuthState): Promise<string> {
  return new SignJWT({ ...state })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(STATE_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(sessionKey());
}

export async function verifyOAuthState(token: string): Promise<OAuthState | null> {
  try {
    const { payload } = await jwtVerify(token, sessionKey(), { audience: STATE_AUDIENCE, algorithms: ['HS256'] });
    if (typeof payload.stateId !== 'string' || typeof payload.returnTo !== 'string') return null;
    return { stateId: payload.stateId, returnTo: payload.returnTo };
  } catch {
    return null;
  }
}

// Only same-site paths, so the login can't be used as an open redirect
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/book';
  return value;
}

type TokenResponse = { access_token?: string; user?: { id?: number | string; name?: string } };

// Exchange the authorization code, read the user Canvas returns with the token, then revoke it
export async function exchangeCode(config: CanvasOAuthConfig, code: string, redirectUri: string): Promise<CanvasUser> {
  const res = await fetch(`${config.baseUrl}/login/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Canvas rejected the login (${res.status}).`);
  const body = (await res.json()) as TokenResponse;
  if (!body.user?.id) throw new Error('Canvas did not say who signed in.');

  if (body.access_token) {
    // Best effort: the token isn't needed after login, so don't leave it valid
    await fetch(`${config.baseUrl}/login/oauth2/token`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${body.access_token}` },
      cache: 'no-store',
    }).catch(() => {});
  }

  return { id: String(body.user.id), name: body.user.name || 'Canvas user', canvasUrl: config.baseUrl };
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: BASE_PATH || '/',
  maxAge,
});
