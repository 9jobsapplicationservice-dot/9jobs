import { NextResponse } from 'next/server';

import { getAdminSessionCookieOptions } from '@/lib/admin/auth/cookies';
import { ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin/auth/constants';
import { createAdminSessionToken } from '@/lib/admin/auth/session';
import {
  ADMIN_GOOGLE_ALLOWED_EMAIL,
  ADMIN_GOOGLE_OAUTH_COOKIE_NAME,
  exchangeCodeForGoogleProfile,
  getAdminGoogleOAuthConfig,
  getGoogleOAuthCookieOptions,
  getRequestOrigin,
  parseGoogleOAuthStateValue,
} from '@/lib/admin/auth/google-oauth';

export const dynamic = 'force-dynamic';

function redirectToAdminLogin(request, message, nextPath = '/admin/dashboard') {
  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('next', nextPath);
  loginUrl.searchParams.set('error', message);
  return loginUrl;
}

function clearGoogleOauthCookie(response) {
  response.cookies.set(ADMIN_GOOGLE_OAUTH_COOKIE_NAME, '', {
    ...getGoogleOAuthCookieOptions(),
    maxAge: 0,
  });
}

function readOauthCookieFromRequest(request) {
  if (request.cookies?.get) {
    return request.cookies.get(ADMIN_GOOGLE_OAUTH_COOKIE_NAME)?.value || '';
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const parts = cookieHeader.split(';').map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${ADMIN_GOOGLE_OAUTH_COOKIE_NAME}=`));

  if (!match) {
    return '';
  }

  return match.slice(`${ADMIN_GOOGLE_OAUTH_COOKIE_NAME}=`.length);
}

export async function GET(request) {
  const cookieValue = readOauthCookieFromRequest(request);
  const statePayload = parseGoogleOAuthStateValue(cookieValue);
  const nextPath = statePayload?.nextPath || '/admin/dashboard';
  const requestUrl = new URL(request.url);

  try {
    const code = requestUrl.searchParams.get('code');
    const state = requestUrl.searchParams.get('state');

    if (!statePayload || !code || !state || state !== statePayload.state) {
      const invalidStateResponse = NextResponse.redirect(
        redirectToAdminLogin(request, 'Google sign-in could not be verified.', nextPath)
      );
      clearGoogleOauthCookie(invalidStateResponse);
      return invalidStateResponse;
    }

    const { clientId, clientSecret } = getAdminGoogleOAuthConfig();
    const redirectUri = `${getRequestOrigin(request)}/auth/google/callback`;
    const profile = await exchangeCodeForGoogleProfile({
      code,
      clientId,
      clientSecret,
      redirectUri,
    });

    const email = String(profile?.email || '').trim().toLowerCase();

    if (email !== ADMIN_GOOGLE_ALLOWED_EMAIL) {
      const deniedResponse = NextResponse.redirect(
        redirectToAdminLogin(request, 'This Google account is not allowed for admin access.', nextPath)
      );
      clearGoogleOauthCookie(deniedResponse);
      return deniedResponse;
    }

    const token = await createAdminSessionToken({
      email,
      name: profile?.name || '9Jobs Admin',
    });

    const response = NextResponse.redirect(new URL(nextPath, request.url));
    response.cookies.set(
      ADMIN_SESSION_COOKIE_NAME,
      token,
      getAdminSessionCookieOptions()
    );
    clearGoogleOauthCookie(response);

    return response;
  } catch (error) {
    const errorResponse = NextResponse.redirect(
      redirectToAdminLogin(request, 'Google sign-in failed. Please try again.', nextPath)
    );
    clearGoogleOauthCookie(errorResponse);
    return errorResponse;
  }
}
