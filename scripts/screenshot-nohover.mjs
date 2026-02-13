import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5173';
const output = process.argv[3] || '/tmp/app-nohover.png';
const waitMs = parseInt(process.argv[4] || '8000');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

if (page.url().includes('/login')) {
  await page.fill('input[placeholder="@username"]', 'mosszxc');
  await page.fill('input[placeholder="Your password"]', 'Jokerlox1');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(waitMs);
}

// Move mouse to top-right corner (away from chart)
await page.mouse.move(1400, 10);
await page.waitForTimeout(500);

await page.screenshot({ path: output, fullPage: true });
console.log('Saved:', output);
await browser.close();
