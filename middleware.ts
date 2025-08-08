import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// MIDDLEWARE DESHABILITADO - Es mockup, no necesitamos validaciones server-side
export function middleware(request: NextRequest) {
  // Permitir todo - la validación se hace en el cliente con RoleGuard
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}