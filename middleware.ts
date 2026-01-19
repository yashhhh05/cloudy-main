import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  const currentUser = request.cookies.get('appwrite-session')
 
  if (currentUser && request.nextUrl.pathname.startsWith('/sign-in')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (currentUser && request.nextUrl.pathname.startsWith('/sign-up')) {
    return NextResponse.redirect(new URL('/', request.url))
  }
 
  if (!currentUser && !request.nextUrl.pathname.startsWith('/sign-in') && !request.nextUrl.pathname.startsWith('/sign-up')) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
}
 
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
