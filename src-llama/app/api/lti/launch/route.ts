import type { NextRequest } from 'next/server';
import { getPlatform, notConfigured, toolUrl } from '@/lib/lti/config';
import { CLAIM, isStaff } from '@/lib/lti/claims';
import { consumeNonce, signSession, verifyState, type LtiSession } from '@/lib/lti/session';
import { verifyIdToken } from '@/lib/lti/platform';
import { errorPage, handOffPage } from '@/lib/lti/html';
import { findSectionByKey } from '@/lib/textbook/book';
import type { LtiClientSession } from '@/lib/lti/client';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

type ContextClaim = { id?: string; title?: string; label?: string };
type AgsClaim = { lineitem?: string; scope?: string[] };
type DeepLinkClaim = { deep_link_return_url?: string; data?: string };

// Which section a launch opens: the custom "section" parameter set by deep linking,
// or a /book/<chapter>/<section> target link
function sectionFromLaunch(custom: Record<string, unknown> | undefined, targetLinkUri: unknown, base: string) {
  if (typeof custom?.section === 'string' && findSectionByKey(custom.section)) return custom.section;
  if (typeof targetLinkUri === 'string' && targetLinkUri.startsWith(base)) {
    const match = targetLinkUri.slice(base.length).match(/^\/book\/([^/?#]+)\/([^/?#]+)/);
    if (match && findSectionByKey(`${match[1]}/${match[2]}`)) return `${match[1]}/${match[2]}`;
  }
  return undefined;
}

// Step 2 of an LTI 1.3 launch: Canvas posts a signed id_token here
export async function POST(request: NextRequest) {
  const platform = getPlatform();
  if (!platform) return notConfigured();

  const form = await request.formData();
  const idToken = form.get('id_token');
  const stateParam = form.get('state');
  if (typeof idToken !== 'string' || typeof stateParam !== 'string') {
    return errorPage(400, 'The launch is missing its id_token or state.');
  }

  const state = await verifyState(stateParam);
  if (!state) return errorPage(401, 'The launch state is invalid or expired. Reload the page in Canvas.');
  const cookieState = request.cookies.get('lti_state')?.value;
  if (cookieState && cookieState !== state.stateId) return errorPage(401, 'The launch state does not match this browser.');

  let claims;
  try {
    claims = await verifyIdToken(idToken, platform, state.nonce);
  } catch (err) {
    return errorPage(401, err instanceof Error ? err.message : 'The launch token could not be verified.');
  }
  if (!consumeNonce(state.nonce)) return errorPage(401, 'This launch has already been used. Reload the page in Canvas.');

  const base = toolUrl(request);
  const roles = (claims[CLAIM.roles] as string[] | undefined) ?? [];
  const context = claims[CLAIM.context] as ContextClaim | undefined;
  const ags = claims[CLAIM.agsEndpoint] as AgsClaim | undefined;
  const messageType = claims[CLAIM.messageType];

  const session: LtiSession = {
    userId: String(claims.sub),
    name: typeof claims.name === 'string' ? claims.name : undefined,
    roles,
    issuer: platform.issuer,
    clientId: platform.clientId,
    deploymentId: claims[CLAIM.deploymentId] as string,
    contextId: context?.id,
    contextTitle: context?.title ?? context?.label,
    resourceLinkId: (claims[CLAIM.resourceLink] as { id?: string } | undefined)?.id,
    lineItem: ags?.lineitem,
    agsScopes: ags?.scope ?? [],
  };

  let path: string;
  if (messageType === 'LtiDeepLinkingRequest') {
    const settings = claims[CLAIM.deepLinkingSettings] as DeepLinkClaim | undefined;
    if (!settings?.deep_link_return_url) return errorPage(400, 'The deep-linking request has no return URL.');
    session.deepLink = { returnUrl: settings.deep_link_return_url, data: settings.data };
    path = '/lti/deep-link';
  } else if (messageType === 'LtiResourceLinkRequest') {
    session.sectionKey = sectionFromLaunch(
      claims[CLAIM.custom] as Record<string, unknown> | undefined,
      claims[CLAIM.targetLinkUri],
      base
    );
    path = session.sectionKey ? `/book/${session.sectionKey}` : '/book';
  } else {
    return errorPage(400, `Unsupported LTI message type "${String(messageType)}".`);
  }

  const clientSession: LtiClientSession = {
    token: await signSession(session),
    userName: session.name,
    contextTitle: session.contextTitle,
    sectionKey: session.sectionKey,
    gradePassback: Boolean(session.lineItem && session.agsScopes.length > 0),
    isStaff: isStaff(roles),
  };
  return handOffPage(clientSession, `${BASE_PATH}${path}`);
}
