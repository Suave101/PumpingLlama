import { NextResponse, type NextRequest } from 'next/server';
import { toolUrl } from '@/lib/lti/config';
import { errorPage } from '@/lib/lti/html';
import {
  cookieOptions,
  exchangeCode,
  getCanvasOAuth,
  signUser,
  STATE_COOKIE,
  USER_COOKIE,
  USER_MAX_AGE,
  verifyOAuthState,
} from '@/lib/auth/canvas';

const TITLE = 'Canvas login failed';

// Step 2 of "Log in with Canvas": Canvas redirects back here with an authorization code
export async function GET(request: NextRequest) {
  const config = getCanvasOAuth();
  if (!config) return errorPage(503, 'Canvas login is not configured on this server.', TITLE);

  const params = request.nextUrl.searchParams;
  if (params.get('error')) {
    const reason = params.get('error') === 'access_denied' ? 'You declined the login in Canvas.' : params.get('error_description') || params.get('error')!;
    return errorPage(400, reason, TITLE);
  }

  const code = params.get('code');
  const stateParam = params.get('state');
  if (!code || !stateParam) return errorPage(400, 'The login response is missing its code or state.', TITLE);

  const state = await verifyOAuthState(stateParam);
  if (!state) return errorPage(401, 'The login expired. Try logging in again.', TITLE);
  if (request.cookies.get(STATE_COOKIE)?.value !== state.stateId) {
    return errorPage(401, 'This login was started in a different browser. Try logging in again.', TITLE);
  }

  let user;
  try {
    user = await exchangeCode(config, code, `${toolUrl(request)}/api/auth/canvas/callback`);
  } catch (err) {
    return errorPage(502, err instanceof Error ? err.message : 'Canvas did not complete the login.', TITLE);
  }

  const response = NextResponse.redirect(`${toolUrl(request)}${state.returnTo}`);
  response.cookies.set(USER_COOKIE, await signUser(user), cookieOptions(USER_MAX_AGE));
  response.cookies.set(STATE_COOKIE, '', cookieOptions(0));
  return response;
}
