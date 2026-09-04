const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const base = 'http://localhost:3000';
  const consoleMessages = [];
  const failedRequests = [];

  page.on('console', msg => {
    if (['error', 'warning'].includes(msg.type())) {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    }
  });

  page.on('requestfailed', req => {
    failedRequests.push({ url: req.url(), error: req.failure()?.errorText || 'unknown' });
  });

  const measureRoute = async (route, marker) => {
    const started = Date.now();
    const response = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const duringLoad = await page.$$eval('.admin-skeleton', nodes => nodes.length).catch(() => 0);
    await page.waitForSelector('body', { timeout: 60000 });
    await new Promise(r => setTimeout(r, 600));
    const afterLoad = await page.$$eval('.admin-skeleton', nodes => nodes.length).catch(() => 0);
    const text = await page.evaluate(() => document.body.innerText);
    return {
      route,
      status: response?.status() || null,
      elapsedMs: Date.now() - started,
      markerFound: text.includes(marker),
      skeletonDuringLoad: duringLoad,
      skeletonAfterLoad: afterLoad,
      title: await page.title()
    };
  };

  const loginStarted = Date.now();
  await page.goto(base + '/admin/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input[type="email"]', { timeout: 60000 });
  await page.type('input[type="email"]', '9jobsapplicationservice@gmail.com');
  await page.type('input[type="password"]', 'Mayank@1234');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }),
    page.click('button[type="submit"]')
  ]);
  const loginElapsedMs = Date.now() - loginStarted;
  const postLoginText = await page.evaluate(() => document.body.innerText);

  const routes = [];
  routes.push(await measureRoute('/admin/dashboard', 'Welcome to 9Jobs Admin'));
  routes.push(await measureRoute('/admin/agreements', 'Agreement Register'));
  routes.push(await measureRoute('/admin/invoices', 'Invoice Register'));
  routes.push(await measureRoute('/admin/client-information', 'Client Information'));
  routes.push(await measureRoute('/admin/fortnight-agreements', 'Fortnight Agreement Register'));

  await browser.close();

  console.log(JSON.stringify({
    loginElapsedMs,
    loginLandingOk: postLoginText.includes('Welcome to 9Jobs Admin') || postLoginText.includes('Dashboard'),
    routes,
    consoleErrorCount: consoleMessages.length,
    consoleMessages,
    failedRequestCount: failedRequests.length,
    failedRequests
  }, null, 2));
})();
