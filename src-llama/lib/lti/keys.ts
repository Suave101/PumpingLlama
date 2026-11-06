import { createPrivateKey, createPublicKey, generateKeyPairSync, randomBytes, type KeyObject } from 'node:crypto';
import { calculateJwkThumbprint, exportJWK, type JWK } from 'jose';

type ToolKeys = { privateKey: KeyObject; publicJwk: JWK; kid: string };

let cached: Promise<ToolKeys> | null = null;

// RSA key the tool signs with (deep-linking responses and AGS token requests).
// Canvas fetches the public half from /api/lti/jwks.
export function toolKeys(): Promise<ToolKeys> {
  cached ??= (async () => {
    const pem = process.env.LTI_PRIVATE_KEY?.replace(/\\n/g, '\n');
    let privateKey: KeyObject;
    if (pem) {
      privateKey = createPrivateKey(pem);
    } else {
      // Fine for local development; in production a key that changes on every restart breaks grade passback
      console.warn('[lti] LTI_PRIVATE_KEY is not set, using a temporary key for this process');
      privateKey = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
    }
    const publicJwk = await exportJWK(createPublicKey(privateKey));
    const kid = await calculateJwkThumbprint(publicJwk);
    return { privateKey, kid, publicJwk: { ...publicJwk, kid, alg: 'RS256', use: 'sig' } };
  })();
  return cached;
}

let sessionSecret: Uint8Array | null = null;

// HMAC secret for the tool's own short-lived tokens (OIDC state and launch sessions)
export function sessionKey(): Uint8Array {
  if (!sessionSecret) {
    const secret = process.env.LTI_SESSION_SECRET;
    if (!secret) console.warn('[lti] LTI_SESSION_SECRET is not set, using a temporary secret for this process');
    sessionSecret = secret ? new TextEncoder().encode(secret) : new Uint8Array(randomBytes(32));
  }
  return sessionSecret;
}
