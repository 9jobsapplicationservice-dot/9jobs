const puppeteer = require('puppeteer-core');

async function main() {
  const base = 'http://localhost:3000';
  const loginApi = await fetch(`${base}/api/admin/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: '9jobsapplicationservice@gmail.com',
      password: 'Mayank@1234',
    }),
  });

  const cookie = (loginApi.headers.get('set-cookie') || '').split(';')[0];
  if (!cookie) {
    throw new Error('API login failed');
  }

  const invoiceNumber = `9J-LOCAL-UI-${Date.now()}`;
  const payload = {
    invoiceNumber,
    invoiceDate: '2026-08-13',
    billedToName: 'Popup Test Client',
    billedToEmail: '9jobsapplicationservice@gmail.com',
    billedToPhone: '+61422279428',
    weekLabel: '1',
    issuedDate: '2026-08-13',
    validUntil: '2026-08-20',
    dueDate: '2026-08-14',
    description: 'Resume Premium Plan',
    duration: '1 WEEK',
    total: '428',
  };

  const createRes = await fetch(`${base}/api/invoices`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie,
    },
    body: JSON.stringify(payload),
  });
  const created = await createRes.json();
  const invoiceId = created?.invoice?._id;

  if (!invoiceId) {
    throw new Error(`Invoice create failed: ${JSON.stringify(created)}`);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-dev-shm-usage',
      '--user-data-dir=C:/Users/USER/AppData/Local/Temp/codex-local-invoice-ui-check',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.goto(`${base}/admin/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', '9jobsapplicationservice@gmail.com');
    await page.type('input[type="password"]', 'Mayank@1234');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    await page.goto(`${base}/admin/invoices/${invoiceId}`, { waitUntil: 'networkidle2' });
    await page.click('button.admin-dark-button');
    await page.waitForSelector('.admin-modal-card', { timeout: 120000 });

    const screenshot = 'D:/9jobs-website-vercel/9jobs/outputs/localhost-invoice-payment-link-modal.png';
    await page.screenshot({
      path: screenshot,
      fullPage: true,
    });

    const modalText = await page.$eval('.admin-modal-card', (element) => element.innerText);

    console.log(JSON.stringify({
      invoiceId,
      screenshot,
      modalText: modalText.slice(0, 600),
    }, null, 2));
  } finally {
    await browser.close();
    await fetch(`${base}/api/invoices?id=${invoiceId}`, {
      method: 'DELETE',
      headers: { cookie },
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
