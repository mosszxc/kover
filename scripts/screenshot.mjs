import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5173';
const output = process.argv[3] || '/tmp/app-screenshot.png';
const waitMs = parseInt(process.argv[4] || '5000');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

// Login if on login page
if (page.url().includes('/login')) {
  console.log('Logging in...');
  await page.fill('input[placeholder="@username"]', 'mosszxc');
  await page.fill('input[placeholder="Your password"]', 'Jokerlox1');
  await page.click('button:has-text("Sign In")');
  // Wait for redirect away from login
  await page.waitForTimeout(5000);
  console.log('After login, URL:', page.url());
  // Wait for dashboard data to load
  await page.waitForTimeout(waitMs);
}

await page.screenshot({ path: output, fullPage: true });
console.log('Saved:', output);

await browser.close();
