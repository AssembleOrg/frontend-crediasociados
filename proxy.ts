import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protección de rutas por presencia de la cookie de sesión.
 *
 * - /dashboard/* sin cookie → /login.
 * - "/", "/login" y "/dashboard" con cookie → al panel del rol. La app
 *   instalada (PWA) vuelve a abrir en la portada cuando el teléfono la cierra
 *   en segundo plano, y el login mostraba el formulario aunque la sesión
 *   siguiera viva: el cobrador creía que se le había cerrado la sesión.
 * - /login?salir=1 nunca redirige: lo usa el front después de un 401 para no
 *   quedar en bucle si la cookie quedó vieja.
 *
 * El rol se lee del payload del JWT sin verificar la firma: sólo decide a qué
 * pantalla ir; el backend valida el token en cada request.
 */
const ROLE_ROUTES: Record<string, string> = {
  SUPERADMIN: '/dashboard/admin',
  ADMIN: '/dashboard/admin',
  SUBADMIN: '/dashboard/subadmin',
  MANAGER: '/dashboard/prestamista',
};

export function dashboardForToken(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const role = String(JSON.parse(json)?.role || '').toUpperCase();
    return ROLE_ROUTES[role] ?? null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  if (pathname === '/' || pathname === '/login' || pathname === '/dashboard') {
    if (pathname === '/login' && searchParams.has('salir')) return NextResponse.next();
    const target = dashboardForToken(token);
    if (target) return NextResponse.redirect(new URL(target, request.url));
    if (pathname === '/dashboard') return NextResponse.redirect(new URL('/login', request.url));
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/dashboard', '/dashboard/:path*'],
};
