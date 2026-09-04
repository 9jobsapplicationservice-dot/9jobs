const puppeteer = require('puppeteer-core');

const BASE_URL = 'http://localhost:3000';
const LOGIN_URL = `${BASE_URL}/api/admin/login`;
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function loginAndGetCookie() {
  const response = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: '9jobsapplicationservice@gmail.com',
      password: 'Mayank@1234',
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed with status ${response.status}`);
  }

  const setCookie = response.headers.get('set-cookie') || '';
  const match = setCookie.match(/9jobs_admin_session=([^;]+)/);

  if (!match) {
    throw new Error('Admin session cookie was not returned by login response');
  }

  return match[1];
}

async function measureRoute(page, route, marker) {
  const consoleMessages = [];
  const onConsole = (msg) => {
    if (['error', 'warning'].includes(msg.type())) {
      consoleMessages.push(msg.text());
    }
  };

  page.on('console', onConsole);

  const started = Date.now();
  const response = await page.goto(`${BASE_URL}${route}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  const skeletonDuringLoad = await page
    .$$eval('.admin-skeleton', (nodes) => nodes.length)
    .catch(() => 0);

  await page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(400).catch(() => {});

  const skeletonAfterLoad = await page
    .$$eval('.admin-skeleton', (nodes) => nodes.length)
    .catch(() => 0);

  const text = await page.evaluate(() => document.body.innerText);

  page.off('console', onConsole);

  return {
    route,
    status: response?.status() || null,
    elapsedMs: Date.now() - started,
    markerFound: text.includes(marker),
    skeletonDuringLoad,
    skeletonAfterLoad,
    consoleErrorCount: consoleMessages.length,
    consoleMessages,
  };
}

(async () => {
  const cookieValue = await loginAndGetCookie();
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setCookie({
    name: '9jobs_admin_session',
    value: cookieValue,
    domain: 'localhost',
    path: '/',
    httpOnly: false,
  });

  const checks = [
    ['/admin/dashboard', 'Welcome to 9Jobs Admin'],
    ['/admin/invoices', 'Invoice Register'],
    ['/admin/invoices/new', 'Create Invoice'],
    ['/admin/agreements', 'Agreement Register'],
    ['/admin/client-information', 'Client Information Register'],
  ];

  const results = [];
  for (const [route, marker] of checks) {
    results.push(await measureRoute(page, route, marker));
  }

  await browser.close();
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
