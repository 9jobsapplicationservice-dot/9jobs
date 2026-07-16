import crypto from 'node:crypto';

export const ADMIN_GOOGLE_ALLOWED_EMAIL = '9jobsapplicationservice@gmail.com';
export const ADMIN_GOOGLE_OAUTH_COOKIE_NAME = '9jobs_admin_google_oauth';

function encodeBase64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));

  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
}

export function sanitizeAdminNextPath(value) {
  if (typeof value !== 'string') {
    return '/admin/dashboard';
  }

  return value.startsWith('/admin') ? value : '/admin/dashboard';
}

export function getAdminGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth is not configured.');
  }

  return {
    clientId,
    clientSecret,
  };
}

export function getGoogleOAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  };
}

export function createGoogleOAuthStateValue(nextPath) {
  return encodeBase64Url(
    JSON.stringify({
      state: crypto.randomBytes(24).toString('hex'),
      nextPath: sanitizeAdminNextPath(nextPath),
    })
  );
}

export function parseGoogleOAuthStateValue(value) {
  if (!value) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(value));

    if (!payload?.state || typeof payload.state !== 'string') {
      return null;
    }

    return {
      state: payload.state,
      nextPath: sanitizeAdminNextPath(payload.nextPath),
    };
  } catch {
    return null;
  }
}

export function getRequestOrigin(request) {
  const requestUrl = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || requestUrl.host;
  const protocol = request.headers.get('x-forwarded-proto') || requestUrl.protocol.replace(':', '');

  return `${protocol}://${host}`;
}

export function buildGoogleAuthUrl({ clientId, redirectUri, state }) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForGoogleProfile({ code, clientId, clientSecret, redirectUri }) {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Unable to exchange Google authorization code.');
  }

  const tokenPayload = await tokenResponse.json();

  if (!tokenPayload?.access_token) {
    throw new Error('Google access token was not returned.');
  }

  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: {
      authorization: `Bearer ${tokenPayload.access_token}`,
    },
  });

  if (!profileResponse.ok) {
    throw new Error('Unable to fetch Google user profile.');
  }

  return profileResponse.json();
}
