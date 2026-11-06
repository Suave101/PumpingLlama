import { toolKeys } from '@/lib/lti/keys';

// The key comes from the environment at runtime, never from the build
export const dynamic = 'force-dynamic';

// Public key Canvas uses to verify what the tool signs
export async function GET() {
  const { publicJwk } = await toolKeys();
  return Response.json({ keys: [publicJwk] }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
