import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/groups', '/friends', '/profile', '/settings', '/inbox', '/quick-split'];
const authRoutes = ['/login'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  const isJoinRoute = pathname.startsWith('/split/join/');
  const isSplitRoute = pathname.startsWith('/split') && !isJoinRoute;

  const isProtected =
    protectedRoutes.some((route) => pathname.startsWith(route)) || isSplitRoute;
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/groups/:path*', '/friends/:path*', '/profile/:path*', '/settings/:path*', '/inbox/:path*', '/quick-split', '/split/:path*', '/login'],
};