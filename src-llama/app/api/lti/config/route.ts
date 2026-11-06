import type { NextRequest } from 'next/server';
import { toolUrl } from '@/lib/lti/config';
import { SCOPE } from '@/lib/lti/claims';

export const dynamic = 'force-dynamic';

// Canvas developer key configuration. In Canvas: Admin → Developer Keys → + LTI Key →
// Method "Enter URL", and paste this route's URL.
export async function GET(request: NextRequest) {
  const base = toolUrl(request);
  const deepLink = { message_type: 'LtiDeepLinkingRequest', target_link_uri: `${base}/book` };

  return Response.json({
    title: 'Pumping Llama',
    description: 'Interactive automata theory textbook with auto-graded labs.',
    oidc_initiation_url: `${base}/api/lti/login`,
    target_link_uri: `${base}/book`,
    public_jwk_url: `${base}/api/lti/jwks`,
    scopes: [SCOPE.lineItem, SCOPE.score],
    extensions: [
      {
        platform: 'canvas.instructure.com',
        domain: new URL(base).host,
        privacy_level: 'public',
        settings: {
          icon_url: `${base}/icon.svg`,
          placements: [
            { placement: 'link_selection', text: 'Pumping Llama section', ...deepLink },
            { placement: 'assignment_selection', text: 'Pumping Llama section', ...deepLink },
            {
              placement: 'course_navigation',
              text: 'Textbook',
              message_type: 'LtiResourceLinkRequest',
              target_link_uri: `${base}/book`,
              default: 'enabled',
            },
          ],
        },
      },
    ],
  });
}
