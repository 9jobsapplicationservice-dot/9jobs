const puppeteer = require('puppeteer-core');

(async () => {
  const cookieValue = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIiLCJlbWFpbCI6Ijlqb2JzYXBwbGljYXRpb25zZXJ2aWNlQGdtYWlsLmNvbSIsIm5hbWUiOiI5Sm9icyBBZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4NzExNzU2NCwiZXhwIjoxNzg3MTYwNzY0fQ.X170haQy1kLB7jprvoK4SZ0v93djZYSuj74q7lyeUUU';
  const browser = await puppeteer.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setCookie({ name: '9jobs_admin_session', value: cookieValue, domain: 'localhost', path: '/', httpOnly: false });
  const consoleMessages = [];
  page.on('console', msg => { if (['error','warning'].includes(msg.type())) consoleMessages.push(msg.text()); });
  const started = Date.now();
  const response = await page.goto('http://localhost:3000/admin/agreements', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const duringLoad = await page.$$eval('.admin-skeleton', nodes => nodes.length).catch(() => 0);
  await new Promise(r => setTimeout(r, 800));
  const afterLoad = await page.$$eval('.admin-skeleton', nodes => nodes.length).catch(() => 0);
  const text = await page.evaluate(() => document.body.innerText);
  await browser.close();
  console.log(JSON.stringify({ status: response?.status() || null, elapsedMs: Date.now() - started, markerFound: text.includes('Agreement Register'), skeletonDuringLoad: duringLoad, skeletonAfterLoad: afterLoad, consoleErrorCount: consoleMessages.length }, null, 2));
})();
