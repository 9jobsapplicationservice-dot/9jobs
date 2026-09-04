const BASE_URL = 'http://localhost:3000';

async function loginAndGetCookie() {
  const started = Date.now();
  const response = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: '9jobsapplicationservice@gmail.com',
      password: 'Mayank@1234',
    }),
  });

  const setCookie = response.headers.get('set-cookie') || '';
  const match = setCookie.match(/9jobs_admin_session=([^;]+)/);
  if (!match) {
    throw new Error(`Login failed or no session cookie returned (status ${response.status})`);
  }

  return {
    cookie: `9jobs_admin_session=${match[1]}`,
    elapsedMs: Date.now() - started,
    status: response.status,
  };
}

async function checkRoute(cookieHeader, route, marker) {
  const started = Date.now();
  const response = await fetch(`${BASE_URL}${route}`, {
    headers: {
      Cookie: cookieHeader,
    },
  });
  const text = await response.text();
  return {
    route,
    status: response.status,
    elapsedMs: Date.now() - started,
    markerFound: text.includes(marker),
  };
}

(async () => {
  const login = await loginAndGetCookie();
  const checks = [
    ['/admin/dashboard', 'Welcome to 9Jobs Admin'],
    ['/admin/invoices', 'Invoice Register'],
    ['/admin/invoices/new', 'Create Invoice'],
    ['/admin/agreements', 'Agreement Register'],
    ['/admin/client-information', 'Client Information Register'],
  ];

  const results = [];
  for (const [route, marker] of checks) {
    results.push(await checkRoute(login.cookie, route, marker));
  }

  console.log(
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        login,
        results,
      },
      null,
      2,
    ),
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
