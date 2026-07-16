import { afterAll, beforeEach, describe, expect, jest, test } from '@jest/globals';

const originalFetch = global.fetch;

async function loadGoogleAuthRoutes() {
  jest.resetModules();

  const [{ GET: startGoogleAuth }, { GET: completeGoogleAuth }] = await Promise.all([
    import('@/app/auth/google/route'),
    import('@/app/auth/google/callback/route'),
  ]);

  return {
    startGoogleAuth,
    completeGoogleAuth,
  };
}

describe('admin google auth routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'google-route-test-secret';
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test('starts google auth and stores oauth state', async () => {
    const { startGoogleAuth } = await loadGoogleAuthRoutes();

    const response = await startGoogleAuth(
      new Request('http://localhost/auth/google?next=/admin/dashboard', {
        headers: {
          host: 'localhost',
        },
      })
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('https://accounts.google.com/o/oauth2/v2/auth?');
    expect(response.headers.get('set-cookie')).toContain('9jobs_admin_google_oauth=');
  });

  test('creates an admin session for the allowed google account', async () => {
    const { startGoogleAuth, completeGoogleAuth } = await loadGoogleAuthRoutes();
    const startResponse = await startGoogleAuth(
      new Request('http://localhost/auth/google?next=/admin/dashboard', {
        headers: {
          host: 'localhost',
        },
      })
    );

    const oauthCookie = startResponse.headers.get('set-cookie').split(';')[0];
    const location = startResponse.headers.get('location');
    const state = new URL(location).searchParams.get('state');

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'google-access-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          email: '9jobsapplicationservice@gmail.com',
          name: '9Jobs Admin',
        }),
      });

    const response = await completeGoogleAuth(
      new Request(`http://localhost/auth/google/callback?code=test-code&state=${state}`, {
        headers: {
          cookie: oauthCookie,
          host: 'localhost',
        },
      })
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/admin/dashboard');
    expect(response.headers.get('set-cookie')).toContain('9jobs_admin_session=');
  });

  test('rejects a google account that is not the allowed admin email', async () => {
    const { startGoogleAuth, completeGoogleAuth } = await loadGoogleAuthRoutes();
    const startResponse = await startGoogleAuth(
      new Request('http://localhost/auth/google?next=/admin/dashboard', {
        headers: {
          host: 'localhost',
        },
      })
    );

    const oauthCookie = startResponse.headers.get('set-cookie').split(';')[0];
    const location = startResponse.headers.get('location');
    const state = new URL(location).searchParams.get('state');

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'google-access-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          email: 'someoneelse@gmail.com',
          name: 'Other User',
        }),
      });

    const response = await completeGoogleAuth(
      new Request(`http://localhost/auth/google/callback?code=test-code&state=${state}`, {
        headers: {
          cookie: oauthCookie,
          host: 'localhost',
        },
      })
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/admin/login');
    expect(response.headers.get('location')).toContain('This+Google+account+is+not+allowed+for+admin+access.');
  });
});
