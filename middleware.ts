import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * KISS Middleware - Simple route protection
 * Validates JWT tokens and enforces role-based access
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check for auth token cookie (lightweight version for middleware)
  const authTokenCookie = request.cookies.get('auth-storage-token');
  
  // Fallback to old cookie format for backward compatibility
  const authCookie = authTokenCookie || request.cookies.get('auth-storage');
  
  if (!authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Decode the cookie value in case it's URL encoded
    const decodedValue = decodeURIComponent(authCookie.value);
    const authData = JSON.parse(decodedValue);
    
    // Handle different formats
    let actualData;
    
    // New lightweight format (from hybridStorage)
    if (authData.userId && authData.token) {
      actualData = {
        userId: authData.userId,
        userRole: authData.userRole,
        isAuthenticated: authData.isAuthenticated,
        token: authData.token,
      };
    }
    // Old Zustand persist format
    else if (authData.state) {
      actualData = authData.state;
    } 
    // Direct format
    else if (authData.user !== undefined) {
      actualData = authData;
    } 
    else {
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
