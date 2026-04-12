import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * KISS Middleware - Simple route protection
 * Validates presence of authenticated session cookie
 */
export function middleware(request: NextRequest) {
  const accessTokenCookie = request.cookies.get('access_token');
  if (!accessTokenCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
