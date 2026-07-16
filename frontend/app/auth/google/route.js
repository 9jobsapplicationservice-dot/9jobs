import { NextResponse } from 'next/server';

import {
  ADMIN_GOOGLE_OAUTH_COOKIE_NAME,
  buildGoogleAuthUrl,
  createGoogleOAuthStateValue,
  getAdminGoogleOAuthConfig,
  getGoogleOAuthCookieOptions,
  parseGoogleOAuthStateValue,
  getRequestOrigin,
} from '@/lib/admin/auth/google-oauth';

export const dynamic = 'force-dynamic';

function getErrorRedirect(request, message) {
  const nextPath = new URL(request.url).searchParams.get('next') || '/admin/dashboard';
  return new URL(`/admin/login?next=${encodeURIComponent(nextPath)}&error=${encodeURIComponent(message)}`, request.url);
}

export async function GET(request) {
  try {
    const { clientId } = getAdminGoogleOAuthConfig();
    const nextPath = new URL(request.url).searchParams.get('next') || '/admin/dashboard';
    const cookieValue = createGoogleOAuthStateValue(nextPath);
    const oauthState = parseGoogleOAuthStateValue(cookieValue)?.state;

    if (!oauthState) {
      throw new Error('Unable to initialize Google OAuth state.');
    }

    const redirectUri = `${getRequestOrigin(request)}/auth/google/callback`;
    const googleAuthUrl = buildGoogleAuthUrl({
      clientId,
      redirectUri,
      state: oauthState,
    });

    const response = NextResponse.redirect(googleAuthUrl);
    response.cookies.set(
      ADMIN_GOOGLE_OAUTH_COOKIE_NAME,
      cookieValue,
      getGoogleOAuthCookieOptions()
    );

    return response;
  } catch (error) {
    return NextResponse.redirect(getErrorRedirect(request, 'Google sign-in is not configured.'));
  }
}
