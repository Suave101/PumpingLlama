import { randomUUID } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { getPlatform, notConfigured, toolUrl } from '@/lib/lti/config';
import { signState } from '@/lib/lti/session';
import { errorPage } from '@/lib/lti/html';

// Step 1 of an LTI 1.3 launch (OIDC third-party login initiation).
// Canvas calls this with GET or POST; we answer by redirecting to Canvas's authorization endpoint.
async function initiateLogin(request: NextRequest, params: URLSearchParams) {
  const platform = getPlatform();
  if (!platform) return notConfigured();

  const iss = params.get('iss');
  const loginHint = params.get('login_hint');
  const clientId = params.get('client_id');
  if (iss !== platform.issuer) return errorPage(400, `Unknown platform issuer "${iss ?? ''}".`);
  if (!loginHint) return errorPage(400, 'The login request has no login_hint.');
  if (clientId && clientId !== platform.clientId) return errorPage(400, `Unknown client id "${clientId}".`);

  const nonce = randomUUID();
  const stateId = randomUUID();
  const state = await signState({ stateId, nonce });

  const auth = new URL(platform.authUrl);
  auth.search = new URLSearchParams({
    scope: 'openid',
    response_type: 'id_token',
    response_mode: 'form_post',
    prompt: 'none',
    client_id: platform.clientId,
    redirect_uri: `${toolUrl(request)}/api/lti/launch`,
    login_hint: loginHint,
    state,
    nonce,
    ...(params.get('lti_message_hint') ? { lti_message_hint: params.get('lti_message_hint')! } : {}),
  }).toString();

  return new Response(null, {
    status: 302,
    headers: {
      Location: auth.toString(),
      // Binds the launch to this browser when third-party cookies are allowed; the launch
      // falls back to the signed state alone when they're blocked
      'Set-Cookie': `lti_state=${stateId}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=None`,
    },
  });
}

export async function GET(request: NextRequest) {
  return initiateLogin(request, request.nextUrl.searchParams);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const params = new URLSearchParams();
  for (const [key, value] of form) if (typeof value === 'string') params.set(key, value);
  return initiateLogin(request, params);
}
