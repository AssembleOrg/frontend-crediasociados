import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * KISS Middleware - Simple route protection
 * Validates JWT tokens and enforces role-based access
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check for auth storage cookie
  const authCookie = request.cookies.get('auth-storage');
  
  if (!authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Decode the cookie value in case it's URL encoded
    const decodedValue = decodeURIComponent(authCookie.value);
    const authData = JSON.parse(decodedValue);
    
    // Handle different Zustand persist formats
    let actualData;
    if (authData.state) {
      // Format: { state: { user, token, ... }, version: 0 }
      actualData = authData.state;
    } else if (authData.user !== undefined) {
      // Direct format: { user, token, ... }
      actualData = authData;
    } else {
      // Unexpected format
      throw new Error('Invalid cookie format');
    }
    
    const { userId, userRole, isAuthenticated, token } = actualData;

    // Validate authentication
    if (!isAuthenticated || !userId || !userRole || !token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Role-based route protection uses userRole directly

    // Admin routes
    if (pathname.startsWith('/dashboard/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Subadmin routes  
    if (pathname.startsWith('/dashboard/subadmin') && userRole !== 'subadmin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Prestamista routes
    if (pathname.startsWith('/dashboard/prestamista') && userRole !== 'prestamista') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Valid access - continue
    return NextResponse.next();

  } catch (error) {
    // Invalid cookie data - redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
