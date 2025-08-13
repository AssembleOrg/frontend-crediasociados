import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * KISS Middleware - Simple route protection
 * Validates JWT tokens and enforces role-based access
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for public routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/login') ||
    pathname === '/' ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next();
  }

  // Check for auth storage cookie
  const authCookie = request.cookies.get('auth-storage');
  
  console.log('🛡️ Middleware Debug - Path:', pathname);
  console.log('🛡️ Middleware Debug - Auth cookie exists:', !!authCookie);
  
  if (!authCookie) {
    console.log('🛡️ Middleware Debug - No auth cookie found, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  console.log('🛡️ Middleware Debug - Raw cookie value:', authCookie.value);

  try {
    // Decode the cookie value in case it's URL encoded
    const decodedValue = decodeURIComponent(authCookie.value);
    console.log('🛡️ Middleware Debug - Decoded cookie value:', decodedValue);
    
    const authData = JSON.parse(decodedValue);
    console.log('🛡️ Middleware Debug - Parsed auth data:', JSON.stringify(authData, null, 2));
    
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
      console.error('🛡️ Middleware Debug - Unexpected cookie format:', authData);
      throw new Error('Invalid cookie format');
    }
    
    console.log('🛡️ Middleware Debug - Actual auth data:', JSON.stringify(actualData, null, 2));
    
    const { user, isAuthenticated, token } = actualData;

    // Validate authentication
    console.log('🛡️ Middleware Debug - Validation check:');
    console.log('  - isAuthenticated:', isAuthenticated);
    console.log('  - user exists:', !!user);
    console.log('  - token exists:', !!token);
    console.log('  - user role:', user?.role);
    
    if (!isAuthenticated || !user || !token) {
      console.log('🛡️ Middleware Debug - Validation failed, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Role-based route protection
    const userRole = user.role;
    console.log('🛡️ Middleware Debug - Role check for path:', pathname, 'user role:', userRole);

    // Admin routes
    if (pathname.startsWith('/dashboard/admin') && userRole !== 'admin') {
      console.log('🛡️ Middleware Debug - Admin route denied for role:', userRole);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Subadmin routes  
    if (pathname.startsWith('/dashboard/subadmin') && userRole !== 'subadmin') {
      console.log('🛡️ Middleware Debug - Subadmin route denied for role:', userRole);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Prestamista routes
    if (pathname.startsWith('/dashboard/prestamista') && userRole !== 'prestamista') {
      console.log('🛡️ Middleware Debug - Prestamista route denied for role:', userRole);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Valid access - continue
    console.log('🛡️ Middleware Debug - Access granted for path:', pathname, 'role:', userRole);
    return NextResponse.next();

  } catch (error) {
    // Invalid cookie data - redirect to login
    console.error('🛡️ Middleware Debug - Cookie parsing error:', error);
    console.error('🛡️ Middleware Debug - Raw cookie that failed:', authCookie?.value);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
