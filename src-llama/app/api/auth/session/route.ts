import { NextResponse, type NextRequest } from 'next/server';
import { cookieOptions, getCanvasOAuth, USER_COOKIE, verifyUser } from '@/lib/auth/canvas';

// Who is logged in with Canvas, and whether Canvas login is available at all
export async function GET(request: NextRequest) {
  const user = await verifyUser(request.cookies.get(USER_COOKIE)?.value);
  return NextResponse.json(
    { enabled: Boolean(getCanvasOAuth()), user: user ? { name: user.name } : null },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

// Log out
export async function DELETE() {
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(USER_COOKIE, '', cookieOptions(0));
  return response;
}
