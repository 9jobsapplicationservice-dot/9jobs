const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input[type="email"]', { timeout: 60000 });
  await page.type('input[type="email"]', '9jobsapplicationservice@gmail.com');
  await page.type('input[type="password"]', 'Mayank@1234');
  await page.$eval('form', form => form.requestSubmit());
  await new Promise(r => setTimeout(r, 2000));
  const result = await page.evaluate(() => ({
    href: location.href,
    title: document.title,
    body: document.body.innerText,
    cookies: document.cookie
  }));
  await browser.close();
  console.log(JSON.stringify(result, null, 2));
})();
