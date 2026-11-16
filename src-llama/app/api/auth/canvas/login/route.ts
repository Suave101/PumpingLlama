import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { toolUrl } from '@/lib/lti/config';
import { cookieOptions, getCanvasOAuth, safeReturnTo, signOAuthState, STATE_COOKIE } from '@/lib/auth/canvas';
import { errorPage } from '@/lib/lti/html';

// Step 1 of "Log in with Canvas": send the browser to Canvas's OAuth2 authorize page
export async function GET(request: NextRequest) {
  const config = getCanvasOAuth();
  if (!config) return errorPage(503, 'Canvas login is not configured on this server.', 'Canvas login unavailable');

  const stateId = randomUUID();
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const state = await signOAuthState({ stateId, returnTo });

  const auth = new URL(`${config.baseUrl}/login/oauth2/auth`);
  auth.search = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: `${toolUrl(request)}/api/auth/canvas/callback`,
    state,
  }).toString();

  const response = NextResponse.redirect(auth);
  // Binds the callback to this browser (first-party, so SameSite=Lax gets through the redirect back)
  response.cookies.set(STATE_COOKIE, stateId, cookieOptions(600));
  return response;
}
