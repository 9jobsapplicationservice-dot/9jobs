import { NextResponse } from 'next/server';

import { verifyAdminSessionToken } from '@/lib/admin/auth/session';

const ADMIN_SESSION_COOKIE_NAME = '9jobs_admin_session';

function withAdminRouteHeader(request) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-9jobs-admin-route', '1');

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

async function hasValidAdminSession(request) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  try {
    await verifyAdminSessionToken(token);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login' || pathname === '/admin/reset-password') {
    return withAdminRouteHeader(request);
  }

  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  const isAuthorized = await hasValidAdminSession(request);

  if (isAuthorized) {
    return withAdminRouteHeader(request);
  }

  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('next', pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
