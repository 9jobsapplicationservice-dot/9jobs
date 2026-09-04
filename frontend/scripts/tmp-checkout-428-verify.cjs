const puppeteer = require('puppeteer-core');

async function main() {
  const base = 'https://9jobs.co';
  const loginRes = await fetch(`${base}/api/admin/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: '9jobsapplicationservice@gmail.com',
      password: 'Mayank@1234',
    }),
  });
  const cookie = (loginRes.headers.get('set-cookie') || '').split(';')[0];
  const invoiceNumber = `9J-LIVE-${Date.now()}`;
  const payload = {
    invoiceNumber,
    invoiceDate: '2026-08-13',
    billedToName: 'Stripe Verify Client',
    billedToEmail: 'stripe.verify.client@example.com',
    billedToPhone: '+61422279428',
    weekLabel: '1',
    issuedDate: '2026-08-13',
    validUntil: '2026-08-20',
    dueDate: '2026-08-14',
    description: 'Live amount and checkout verification',
    duration: '1 WEEK',
    total: '428',
  };

  const createRes = await fetch(`${base}/api/invoices`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify(payload),
  });
  const created = await createRes.json();

  const linkRes = await fetch(`${base}/api/invoices/${created.invoice._id}/payment-link`, {
    method: 'POST',
    headers: { cookie },
  });
  const linkText = await linkRes.text();
  let link;
  try {
    link = JSON.parse(linkText);
  } catch {
    throw new Error(`Payment link response ${linkRes.status}: ${linkText.slice(0, 1000)}`);
  }

  if (!link?.checkoutUrl) {
    throw new Error(`Missing checkoutUrl in payment-link response: ${JSON.stringify(link)}`);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-dev-shm-usage',
      '--user-data-dir=C:/Users/USER/AppData/Local/Temp/codex-chrome-checkout-428-verify',
    ],
  });
  const page = await browser.newPage();
  await page.goto(link.checkoutUrl, { waitUntil: 'networkidle2', timeout: 120000 });
  const text = await page.evaluate(() => document.body.innerText.slice(0, 4000));
  await page.screenshot({
    path: 'D:/9jobs-website-vercel/9jobs/outputs/checkout-428-link-disabled.png',
    fullPage: true,
  });
  await browser.close();

  const deleteRes = await fetch(`${base}/api/invoices?id=${created.invoice._id}`, {
    method: 'DELETE',
    headers: { cookie },
  });

  console.log(JSON.stringify({
    loginStatus: loginRes.status,
    createStatus: createRes.status,
    paymentLinkStatus: linkRes.status,
    deleteStatus: deleteRes.status,
    invoiceId: created.invoice._id,
    invoiceNumber,
    checkoutUrl: link.checkoutUrl,
    checkoutText: text,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
