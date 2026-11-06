import type { NextRequest } from 'next/server';

// One Canvas platform, configured through environment variables (see .env.example).
// Defaults are Instructure-hosted Canvas; self-hosted and test instances override them.
export type LtiPlatform = {
  issuer: string;
  clientId: string;
  authUrl: string;
  tokenUrl: string;
  tokenAudience: string;
  jwksUrl: string;
  deploymentIds: string[];
};

export function getPlatform(): LtiPlatform | null {
  const clientId = process.env.LTI_CLIENT_ID;
  if (!clientId) return null;
  const tokenUrl = process.env.LTI_PLATFORM_TOKEN_URL || 'https://sso.canvaslms.com/login/oauth2/token';
  return {
    issuer: process.env.LTI_PLATFORM_ISSUER || 'https://canvas.instructure.com',
    clientId,
    authUrl: process.env.LTI_PLATFORM_AUTH_URL || 'https://sso.canvaslms.com/api/lti/authorize_redirect',
    tokenUrl,
    tokenAudience: process.env.LTI_PLATFORM_TOKEN_AUDIENCE || tokenUrl,
    jwksUrl: process.env.LTI_PLATFORM_JWKS_URL || 'https://sso.canvaslms.com/api/lti/security/jwks',
    deploymentIds: (process.env.LTI_DEPLOYMENT_IDS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Public URL of this site, including the base path. Set LTI_TOOL_URL behind a proxy,
// where the request origin may not be the address Canvas uses.
export function toolUrl(request: NextRequest): string {
  const configured = process.env.LTI_TOOL_URL;
  if (configured) return configured.replace(/\/$/, '');
  return `${request.nextUrl.origin}${BASE_PATH}`;
}

export const notConfigured = () =>
  new Response('Canvas integration is not configured on this server (LTI_CLIENT_ID is missing).', { status: 503 });
