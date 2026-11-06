import { randomUUID } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify, SignJWT, type JWTPayload } from 'jose';
import type { LtiPlatform } from './config';
import { CLAIM } from './claims';
import { toolKeys } from './keys';

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

// Verify the id_token Canvas posts to the launch endpoint
export async function verifyIdToken(idToken: string, platform: LtiPlatform, nonce: string): Promise<JWTPayload> {
  let jwks = jwksCache.get(platform.jwksUrl);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(platform.jwksUrl));
    jwksCache.set(platform.jwksUrl, jwks);
  }

  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: platform.issuer,
    audience: platform.clientId,
    algorithms: ['RS256'],
  });

  if (payload.nonce !== nonce) throw new Error('The launch nonce does not match the login request.');
  if (Array.isArray(payload.aud) && payload.aud.length > 1 && payload.azp !== platform.clientId) {
    throw new Error('The launch was issued for a different tool.');
  }
  if (payload[CLAIM.version] !== '1.3.0') throw new Error('Only LTI 1.3 launches are supported.');

  const deploymentId = payload[CLAIM.deploymentId];
  if (typeof deploymentId !== 'string') throw new Error('The launch has no deployment id.');
  if (platform.deploymentIds.length > 0 && !platform.deploymentIds.includes(deploymentId)) {
    throw new Error(`Deployment ${deploymentId} is not allowed on this server.`);
  }

  return payload;
}

// Signed JWT the tool sends back to the platform (deep-linking responses)
export async function signForPlatform(platform: LtiPlatform, claims: Record<string, unknown>): Promise<string> {
  const { privateKey, kid } = await toolKeys();
  return new SignJWT({ ...claims, nonce: randomUUID() })
    .setProtectedHeader({ alg: 'RS256', kid, typ: 'JWT' })
    .setIssuer(platform.clientId)
    .setAudience(platform.issuer)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);
}

const tokenCache = new Map<string, { token: string; expires: number }>();

// OAuth2 client-credentials grant with a signed JWT assertion, as LTI Advantage requires
async function accessToken(platform: LtiPlatform, scopes: string[]): Promise<string> {
  const scope = [...scopes].sort().join(' ');
  const hit = tokenCache.get(scope);
  if (hit && hit.expires > Date.now() + 30_000) return hit.token;

  const { privateKey, kid } = await toolKeys();
  const assertion = await new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid })
    .setIssuer(platform.clientId)
    .setSubject(platform.clientId)
    .setAudience(platform.tokenAudience)
    .setIssuedAt()
    .setExpirationTime('5m')
    .setJti(randomUUID())
    .sign(privateKey);

  const res = await fetch(platform.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: assertion,
      scope,
    }),
  });
  if (!res.ok) throw new Error(`Canvas refused the access token request (${res.status}): ${await res.text()}`);

  const body = (await res.json()) as { access_token: string; expires_in?: number };
  tokenCache.set(scope, { token: body.access_token, expires: Date.now() + (body.expires_in ?? 3600) * 1000 });
  return body.access_token;
}

export type Score = {
  userId: string;
  scoreGiven: number;
  scoreMaximum: number;
  activityProgress: 'Initialized' | 'Started' | 'InProgress' | 'Submitted' | 'Completed';
  gradingProgress: 'FullyGraded' | 'Pending' | 'PendingManual' | 'Failed' | 'NotReady';
  timestamp: string;
  comment?: string;
};

// AGS: POST a score to {lineItem}/scores (the line item URL may carry a query string)
export async function postScore(platform: LtiPlatform, lineItem: string, scope: string, score: Score): Promise<void> {
  const token = await accessToken(platform, [scope]);
  const url = new URL(lineItem);
  url.pathname = `${url.pathname.replace(/\/$/, '')}/scores`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/vnd.ims.lis.v1.score+json' },
    body: JSON.stringify(score),
  });
  if (!res.ok) throw new Error(`Canvas refused the score (${res.status}): ${await res.text()}`);
}
